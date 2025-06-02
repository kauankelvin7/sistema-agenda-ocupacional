
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  where, 
  getDoc,
  addDoc,
  orderBy,
  Timestamp,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notification, NotificationType } from "@/types";

// Get all notifications (admin only)
export async function getNotifications(): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, "notifications");
    const notificationsQuery = query(notificationsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(notificationsQuery);
    
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({ 
        id: doc.id, 
        title: data.title,
        message: data.message,
        recipientId: data.recipientId,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        read: data.read,
        type: data.type
      });
    });
    
    return notifications;
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw error;
  }
}

// Get company notifications by company ID, excluding hidden ones
export async function getCompanyNotifications(companyId: string): Promise<Notification[]> {
  try {
    // If no companyId provided, return empty array
    if (!companyId) return [];
    
    console.log(`Querying notifications for company: ${companyId}`);
    
    // Get user's hidden notifications
    const userHiddenNotificationsRef = doc(db, "userHiddenNotifications", companyId);
    const userHiddenDoc = await getDoc(userHiddenNotificationsRef);
    const hiddenNotificationIds = userHiddenDoc.exists() ? userHiddenDoc.data().hiddenIds || [] : [];
    
    const notificationsRef = collection(db, "notifications");
    const notificationsQuery = query(
      notificationsRef, 
      where("recipientId", "in", [companyId, "all"]),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(notificationsQuery);
    
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      // Skip notifications that the user has hidden
      if (hiddenNotificationIds.includes(doc.id)) {
        console.log(`Skipping hidden notification: ${doc.id}`);
        return;
      }
      
      const data = doc.data();
      
      // Handle both Firestore Timestamp and regular date
      let createdAt;
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt) {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = new Date();
      }
      
      notifications.push({ 
        id: doc.id, 
        title: data.title,
        message: data.message,
        recipientId: data.recipientId,
        createdAt,
        read: data.read,
        type: data.type
      });
    });
    
    console.log(`Found ${notifications.length} visible notifications for company ${companyId}`);
    
    return notifications;
  } catch (error) {
    console.error("Error getting company notifications:", error);
    throw error;
  }
}

// Create a new notification
export async function createNotification(notificationData: Omit<Notification, "id" | "createdAt">): Promise<string> {
  try {
    const notificationsRef = collection(db, "notifications");
    
    // Convert date to Firestore timestamp
    const createdAt = Timestamp.now();
    
    const newNotification = {
      ...notificationData,
      createdAt
    };
    
    const docRef = await addDoc(notificationsRef, newNotification);
    console.log(`Created new notification with ID: ${docRef.id} for recipient: ${notificationData.recipientId}`);
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

// Mark all visible notifications for a company as read
export async function markAllNotificationsAsRead(companyId: string): Promise<void> {
  try {
    // Get all visible (non-hidden) notifications for this company
    const notifications = await getCompanyNotifications(companyId);
    const unreadNotifications = notifications.filter(n => !n.read);
    
    // Update each unread notification
    const promises: Promise<void>[] = [];
    unreadNotifications.forEach((notification) => {
      const notificationRef = doc(db, "notifications", notification.id);
      promises.push(updateDoc(notificationRef, { read: true }));
    });
    
    await Promise.all(promises);
    console.log(`Marked ${unreadNotifications.length} notifications as read for company: ${companyId}`);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

// Hide notification for a specific user (visual cleanup)
export async function hideNotificationForUser(notificationId: string, userId: string): Promise<void> {
  try {
    if (!notificationId || !userId) {
      throw new Error("ID da notificação e do usuário são obrigatórios");
    }
    
    console.log(`Hiding notification ${notificationId} for user ${userId}`);
    
    const userHiddenNotificationsRef = doc(db, "userHiddenNotifications", userId);
    
    // Check if document exists
    const userHiddenDoc = await getDoc(userHiddenNotificationsRef);
    
    if (userHiddenDoc.exists()) {
      // Add to existing hidden notifications
      await updateDoc(userHiddenNotificationsRef, {
        hiddenIds: arrayUnion(notificationId),
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new document
      await setDoc(userHiddenNotificationsRef, {
        userId: userId,
        hiddenIds: [notificationId],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    
    console.log(`Successfully hid notification ${notificationId} for user ${userId}`);
  } catch (error) {
    console.error("Error hiding notification for user:", error);
    throw error;
  }
}

// Clear all notifications for a user (visual cleanup)
export async function clearAllNotificationsForUser(userId: string): Promise<void> {
  try {
    if (!userId) {
      throw new Error("ID do usuário é obrigatório");
    }
    
    console.log(`Clearing all notifications for user: ${userId}`);
    
    // Get all visible notifications for the user
    const notifications = await getCompanyNotifications(userId);
    const notificationIds = notifications.map(n => n.id);
    
    if (notificationIds.length === 0) {
      console.log("No notifications to clear");
      return;
    }
    
    const userHiddenNotificationsRef = doc(db, "userHiddenNotifications", userId);
    
    // Set all current notifications as hidden
    await setDoc(userHiddenNotificationsRef, {
      userId: userId,
      hiddenIds: notificationIds,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    console.log(`Successfully cleared ${notificationIds.length} notifications for user ${userId}`);
  } catch (error) {
    console.error("Error clearing notifications for user:", error);
    throw error;
  }
}

// Delete a notification by ID (admin only - removes for everyone)
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    if (!notificationId) {
      throw new Error("ID da notificação inválido");
    }
    
    const notificationRef = doc(db, "notifications", notificationId);
    await deleteDoc(notificationRef);
    console.log(`Notification deleted: ${notificationId}`);
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}
