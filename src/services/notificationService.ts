
class NotificationService {
  private hasPermission: boolean = false;

  constructor() {
    this.checkPermission();
  }

  private async checkPermission() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notification");
      return;
    }

    this.hasPermission = Notification.permission === "granted";
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === "granted";
      
      if (this.hasPermission) {
        this.sendNotification("Notifications Active! 🌿", {
          body: "Plantiva will now alert you about frost, heat, and watering needs.",
          icon: "/logo.png"
        });
      }
      
      return this.hasPermission;
    } catch (error) {
      console.error("Error requesting notification permission", error);
      return false;
    }
  }

  sendNotification(title: string, options?: NotificationOptions) {
    if (!this.hasPermission) {
      console.log("Notification permission not granted. Attempting to request...");
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: "/logo.png",
        badge: "/logo.png",
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error sending notification", error);
    }
  }

  // Specialized notifications
  notifyFrostWarning(temp: number) {
    this.sendNotification("❄️ Frost Warning!", {
      body: `Temperature dropped to ${temp}°C. Protect your sensitive plants!`,
      vibrate: [200, 100, 200]
    } as any);
  }

  notifyHeatStress(temp: number) {
    this.sendNotification("🔥 Heat Stress Alert!", {
      body: `It's ${temp}°C outside. Outdoor plants need extra hydration now.`,
      vibrate: [200, 100, 200]
    } as any);
  }

  notifyWateringNeeded(plantName: string) {
    this.sendNotification("💧 Watering Schedule", {
      body: `Time to hydrate your ${plantName}. Maintain that growth streak!`,
      requireInteraction: true
    });
  }

  notifyLowHumidity(humidity: number) {
    this.sendNotification("💦 Low Humidity Alert", {
      body: `Air is dry (${humidity}%). Consider misting leaves or using a humidifier to prevent leaf crisping.`,
      icon: "/logo.png"
    });
  }

  notifyHighUV(uvIndex: number) {
    this.sendNotification("☀️ High UV Exposure", {
      body: `UV Index is ${uvIndex.toFixed(1)}. Delicate plants may need partial shade to avoid leaf burn.`,
      icon: "/logo.png"
    });
  }

  notifyOptimalConditions() {
    this.sendNotification("🌈 Perfect Botanical Weather!", {
      body: "Current temperature and humidity are in the optimal range for plant growth. Your garden is thriving! ✨",
      icon: "/logo.png"
    });
  }

  notifyTaskCompleted(taskTitle: string) {
    this.sendNotification("✅ Task Accomplished", {
      body: `Great job on: ${taskTitle}. +20 Botanical XP earned!`,
      silent: true
    });
  }

  isPermissionGranted(): boolean {
    return this.hasPermission;
  }
}

export const notificationService = new NotificationService();
