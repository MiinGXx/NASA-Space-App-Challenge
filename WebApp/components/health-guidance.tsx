"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Heart,
    Shield,
    AlertTriangle,
    CheckCircle,
    Bell,
    BellRing,
    Clock,
    X,
} from "lucide-react";
import { useState, useEffect } from "react";

interface HealthGuidanceProps {
    location?: string;
}

interface Notification {
    id: string;
    type: "alert" | "info" | "warning";
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    priority: "high" | "medium" | "low";
}

export function HealthGuidance({ location }: HealthGuidanceProps) {
    const [currentAQI, setCurrentAQI] = useState(42); // Default AQI value
    const [activeTab, setActiveTab] = useState("health");
    const [animatedNotifications, setAnimatedNotifications] = useState<
        Set<string>
    >(new Set());
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "1",
            type: "alert",
            title: "Air Quality Alert",
            message:
                "PM2.5 levels are elevated in your area. Consider limiting outdoor activities.",
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            read: false,
            priority: "high",
        },
        {
            id: "2",
            type: "warning",
            title: "Health Advisory",
            message: "Ozone levels may affect sensitive individuals today.",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: false,
            priority: "medium",
        },
        {
            id: "3",
            type: "info",
            title: "Air Quality Improvement",
            message:
                "Air quality has improved since this morning. Safe for outdoor activities.",
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            read: true,
            priority: "low",
        },
    ]);

    // Update AQI when location changes
    useEffect(() => {
        if (location) {
            // In a real app, this would fetch health data for the location
            // For now, just generate a random AQI value
            const randomAQI = Math.floor(Math.random() * 200) + 10;
            setCurrentAQI(randomAQI);

            // Simulate new notifications for location changes
            const locationNotification: Notification = {
                id: Date.now().toString(),
                type: "info",
                title: "Location Updated",
                message: `Air quality data updated for ${location}`,
                timestamp: new Date(),
                read: false,
                priority: "low",
            };
            setNotifications((prev) => [locationNotification, ...prev]);
        }
    }, [location]);

    // Animate notifications when notifications tab is activated
    useEffect(() => {
        if (activeTab === "notifications") {
            // Clear existing animations first
            setAnimatedNotifications(new Set());

            // Animate each notification with a stagger effect
            notifications.forEach((notification, index) => {
                setTimeout(() => {
                    setAnimatedNotifications(
                        (prev) => new Set([...prev, notification.id])
                    );
                }, index * 100); // 100ms stagger between each notification
            });
        }
    }, [activeTab]);

    // Animate new notifications when they're added (only if notifications tab is active)
    useEffect(() => {
        if (activeTab === "notifications" && notifications.length > 0) {
            // Find notifications that aren't animated yet
            const newNotifications = notifications.filter(
                (n) => !animatedNotifications.has(n.id)
            );

            // Animate only the new notifications
            newNotifications.forEach((notification, index) => {
                setTimeout(() => {
                    setAnimatedNotifications(
                        (prev) => new Set([...prev, notification.id])
                    );
                }, index * 100); // 100ms stagger for new notifications
            });
        }
    }, [notifications]);

    const getHealthGuidance = (aqi: number) => {
        if (aqi <= 50) {
            return {
                icon: CheckCircle,
                color: "text-green-600",
                bgColor:
                    "backdrop-blur-md bg-green-500/20 dark:bg-green-500/15",
                borderColor: "border-green-500/30",
                title: "Good Air Quality",
                description:
                    "Air quality is satisfactory and poses little or no health risk.",
                recommendations: [
                    "Perfect day for outdoor activities",
                    "No health precautions needed",
                    "Great time for exercise outdoors",
                ],
            };
        } else if (aqi <= 100) {
            return {
                icon: Shield,
                color: "text-yellow-600",
                bgColor:
                    "backdrop-blur-md bg-yellow-500/20 dark:bg-yellow-500/15",
                borderColor: "border-yellow-500/30",
                title: "Moderate Air Quality",
                description:
                    "Air quality is acceptable for most people, but sensitive individuals may experience minor issues.",
                recommendations: [
                    "Sensitive individuals should limit prolonged outdoor exertion",
                    "Most people can enjoy normal outdoor activities",
                    "Consider reducing time outdoors if you have respiratory conditions",
                ],
            };
        } else {
            return {
                icon: AlertTriangle,
                color: "text-red-600",
                bgColor: "backdrop-blur-md bg-red-500/20 dark:bg-red-500/15",
                borderColor: "border-red-500/30",
                title: "Unhealthy Air Quality",
                description:
                    "Air quality may cause health concerns for sensitive groups.",
                recommendations: [
                    "Limit outdoor activities",
                    "Wear a mask when going outside",
                    "Keep windows closed and use air purifiers",
                ],
            };
        }
    };

    const guidance = getHealthGuidance(currentAQI);
    const IconComponent = guidance.icon;

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((notification) =>
                notification.id === id
                    ? { ...notification, read: true }
                    : notification
            )
        );
    };

    const dismissNotification = (id: string) => {
        setNotifications((prev) =>
            prev.filter((notification) => notification.id !== id)
        );
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    const getNotificationIcon = (type: Notification["type"]) => {
        switch (type) {
            case "alert":
                return AlertTriangle;
            case "warning":
                return Shield;
            case "info":
                return CheckCircle;
            default:
                return Bell;
        }
    };

    const getNotificationColor = (
        type: Notification["type"],
        priority: Notification["priority"]
    ) => {
        if (priority === "high")
            return "backdrop-blur-md bg-red-500/20 dark:bg-red-500/15 border-red-500/50";
        if (type === "warning")
            return "backdrop-blur-md bg-yellow-500/20 dark:bg-yellow-500/15 border-yellow-500/50";
        return "backdrop-blur-md bg-blue-500/20 dark:bg-blue-500/15 border-blue-500/50";
    };

    const getNotificationTextColor = (
        type: Notification["type"],
        priority: Notification["priority"]
    ) => {
        if (priority === "high") return "text-red-600";
        if (type === "warning") return "text-yellow-600";
        return "text-blue-600";
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)}d ago`;
        }
    };

    return (
        <Card className="w-full min-h-[520px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Health & Notifications
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 min-h-[400px]">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                            value="health"
                            className={
                                `flex items-center gap-2 transition-colors duration-200 ` +
                                (activeTab === "health"
                                    ? "bg-white/70 border-white/50 dark:bg-white/10 text-foreground rounded-lg shadow"
                                    : "")
                            }
                        >
                            <Heart className="h-4 w-4" />
                            Health
                        </TabsTrigger>
                        <TabsTrigger
                            value="notifications"
                            className={
                                `flex items-center gap-2 transition-colors duration-200 ` +
                                (activeTab === "notifications"
                                    ? "bg-white/70 border-white/50 dark:bg-white/10 text-foreground rounded-lg shadow"
                                    : "")
                            }
                        >
                            <div className="relative">
                                <Bell className="h-4 w-4" />
                                {unreadCount > 0 && (
                                    <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-red-500 text-white dark:bg-red-600 dark:text-white">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </div>
                            Notifications
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="health" className="space-y-4 mt-4">
                        <Alert
                            className={`${guidance.bgColor} ${guidance.borderColor}`}
                        >
                            <IconComponent
                                className={`h-4 w-4 ${guidance.color}`}
                            />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <h4 className="font-semibold">
                                        {guidance.title}
                                    </h4>
                                    <p className="text-sm">
                                        {guidance.description}
                                    </p>
                                </div>
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-col lg:flex-row gap-6 pt-4 border-t">
                            <div className="flex-1 space-y-3">
                                <h4 className="font-semibold text-foreground">
                                    Recommendations:
                                </h4>
                                <ul className="space-y-2">
                                    {guidance.recommendations.map(
                                        (rec, index) => (
                                            <li
                                                key={index}
                                                className="flex items-start gap-2 text-sm"
                                            >
                                                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                                <span className="text-muted-foreground">
                                                    {rec}
                                                </span>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                            <div className="flex-1 space-y-3 lg:border-l lg:pl-6">
                                <h4 className="font-semibold text-foreground mb-2">
                                    Sensitive Groups:
                                </h4>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>• Children and elderly</p>
                                    <p>• People with asthma or heart disease</p>
                                    <p>• Pregnant women</p>
                                    <p>• Outdoor workers</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="notifications"
                        className="space-y-3 mt-4 overflow-x-hidden"
                    >
                        {notifications.length === 0 ? (
                            <div className="text-center py-8">
                                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    No notifications
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
                                {notifications.map((notification) => {
                                    const NotificationIcon =
                                        getNotificationIcon(notification.type);
                                    const isAnimated =
                                        animatedNotifications.has(
                                            notification.id
                                        );
                                    return (
                                        <Alert
                                            key={notification.id}
                                            className={`${getNotificationColor(
                                                notification.type,
                                                notification.priority
                                            )} ${
                                                !notification.read
                                                    ? "border-l-4 border-l-primary"
                                                    : "opacity-75"
                                            } cursor-pointer hover:shadow-md transition-all duration-500 ease-out ${
                                                isAnimated
                                                    ? "translate-x-0 opacity-100 scale-100"
                                                    : "translate-x-full opacity-0 scale-95"
                                            }`}
                                            onClick={() =>
                                                markAsRead(notification.id)
                                            }
                                        >
                                            <NotificationIcon
                                                className={`h-4 w-4 ${getNotificationTextColor(
                                                    notification.type,
                                                    notification.priority
                                                )}`}
                                            />
                                            <AlertDescription className="w-full">
                                                <div className="flex items-start justify-between w-full">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4
                                                                className={`font-semibold ${getNotificationTextColor(
                                                                    notification.type,
                                                                    notification.priority
                                                                )}`}
                                                            >
                                                                {
                                                                    notification.title
                                                                }
                                                            </h4>
                                                            {!notification.read && (
                                                                <div className="w-2 h-2 bg-primary rounded-full" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm">
                                                            {
                                                                notification.message
                                                            }
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            <span>
                                                                {formatTimeAgo(
                                                                    notification.timestamp
                                                                )}
                                                            </span>
                                                            <span
                                                                className={`text-xs px-2 py-1 rounded-md font-medium border backdrop-blur-sm bg-white/20 dark:bg-black/20 ${
                                                                    notification.priority ===
                                                                    "high"
                                                                        ? "border-red-500/50"
                                                                        : notification.priority ===
                                                                          "medium"
                                                                        ? "border-yellow-500/50"
                                                                        : "border-blue-500/50"
                                                                }`}
                                                            >
                                                                {
                                                                    notification.priority
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            dismissNotification(
                                                                notification.id
                                                            );
                                                        }}
                                                        className="ml-2 p-1 hover:bg-background/50 rounded flex-shrink-0"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    );
                                })}
                            </div>
                        )}

                        {unreadCount > 0 && (
                            <div className="pt-2 border-t">
                                <button
                                    onClick={() =>
                                        setNotifications((prev) =>
                                            prev.map((n) => ({
                                                ...n,
                                                read: true,
                                            }))
                                        )
                                    }
                                    className="text-sm text-primary hover:underline"
                                >
                                    Mark all as read ({unreadCount})
                                </button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
