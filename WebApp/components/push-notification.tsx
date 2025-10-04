"use client";

import { useState, useEffect } from "react";
import { X, Bell, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationData {
    id: string;
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    duration?: number; // in milliseconds, 0 means persistent
}

interface PushNotificationProps {
    notification: NotificationData | null;
    onClose: () => void;
}

export function PushNotification({ notification, onClose }: PushNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (notification) {
            setIsVisible(true);
            // Small delay to ensure the component is mounted before starting animation
            const timer = setTimeout(() => {
                setIsAnimating(true);
            }, 50);
            
            // Auto-hide after duration (if specified)
            if (notification.duration && notification.duration > 0) {
                const autoHideTimer = setTimeout(() => {
                    handleClose();
                }, notification.duration);
                
                return () => {
                    clearTimeout(timer);
                    clearTimeout(autoHideTimer);
                };
            }
            
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setIsVisible(false), 500); // Wait for exit animation
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            onClose();
        }, 500);
    };

    const getIcon = () => {
        switch (notification?.type) {
            case "success":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "warning":
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case "error":
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getBackgroundColor = () => {
        switch (notification?.type) {
            case "success":
                return "bg-green-500/10 border-green-500/20 backdrop-blur-sm";
            case "warning":
                return "bg-yellow-500/10 border-yellow-500/20 backdrop-blur-sm";
            case "error":
                return "bg-red-500/10 border-red-500/20 backdrop-blur-sm";
            default:
                return "bg-blue-500/10 border-blue-500/20 backdrop-blur-sm";
        }
    };

    if (!isVisible || !notification) {
        return null;
    }

    return (
        <div className="fixed top-4 right-0 z-50 pointer-events-none">
            <div
                className={cn(
                    "w-80 max-w-sm p-4 rounded-lg border shadow-lg pointer-events-auto transform transition-all duration-500 ease-out mr-4",
                    getBackgroundColor(),
                    isAnimating
                        ? "translate-x-0 opacity-100"
                        : "translate-x-full opacity-0"
                )}
            >
                <div className="flex items-start gap-3">
                    {getIcon()}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold !text-black dark:!text-white mb-1">
                            {notification.title}
                        </h4>
                        <p className="text-sm !text-gray-800 dark:!text-gray-200">
                            {notification.message}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        aria-label="Close notification"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook for managing notifications
export function useNotifications() {
    const [notification, setNotification] = useState<NotificationData | null>(null);

    const showNotification = (data: Omit<NotificationData, "id">) => {
        const newNotification: NotificationData = {
            ...data,
            id: Date.now().toString(),
            duration: data.duration ?? 5000, // Default 5 seconds
        };
        setNotification(newNotification);
    };

    const hideNotification = () => {
        setNotification(null);
    };

    return {
        notification,
        showNotification,
        hideNotification,
    };
}