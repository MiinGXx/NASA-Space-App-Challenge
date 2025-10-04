"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

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
                return "border-green-500/30 shadow-green-500/20";
            case "warning":
                return "border-yellow-500/30 shadow-yellow-500/20";
            case "error":
                return "border-red-500/30 shadow-red-500/20";
            default:
                return "border-blue-500/30 shadow-blue-500/20";
        }
    };

    if (!isVisible || !notification || !mounted) {
        return null;
    }

    const notificationElement = (
        <div 
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div className="absolute top-4 right-4 pointer-events-none">
                <div
                    className={cn(
                        "notification-glass w-80 max-w-sm p-4 rounded-xl shadow-2xl pointer-events-auto transform transition-all duration-500 ease-out",
                        getBackgroundColor(),
                        isAnimating
                            ? "translate-x-0 opacity-100 scale-100"
                            : "translate-x-full opacity-0 scale-95"
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
        </div>
    );

    return createPortal(notificationElement, document.body);
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