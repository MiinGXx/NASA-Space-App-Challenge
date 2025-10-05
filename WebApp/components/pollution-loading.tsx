"use client";

import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface PollutionLoadingProps {
    stage?: "initial" | "fetching" | "processing" | "rendering";
    message?: string;
}

export default function PollutionLoading({ 
    stage = "initial", 
    message 
}: PollutionLoadingProps) {
    const getLoadingMessage = () => {
        if (message) return message;
        
        switch (stage) {
            case "fetching":
                return "Fetching pollution data from satellites...";
            case "processing":
                return "Processing air quality measurements...";
            case "rendering":
                return "Rendering pollution heatmap...";
            default:
                return "Loading pollution map...";
        }
    };

    const getProgressDots = () => {
        const dots = ["●", "●", "●"];
        const activeDot = Math.floor(Date.now() / 500) % 3;
        return dots.map((dot, index) => (
            <span
                key={index}
                className={`transition-opacity duration-300 ${
                    index === activeDot ? "opacity-100" : "opacity-30"
                }`}
            >
                {dot}
            </span>
        ));
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
            <Card className="w-96 mx-4">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center space-y-6">
                        {/* Loading animation */}
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-green-600 rounded-full animate-spin animation-delay-150"></div>
                        </div>

                        {/* Loading message */}
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                {getLoadingMessage()}
                            </h3>
                            <div className="flex justify-center space-x-1 text-blue-600 dark:text-blue-400">
                                {getProgressDots()}
                            </div>
                        </div>

                        {/* Progress indicators */}
                        <div className="w-full space-y-3">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Progress</span>
                                <span>{stage === "rendering" ? "95%" : stage === "processing" ? "70%" : stage === "fetching" ? "30%" : "10%"}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: stage === "rendering" ? "95%" : stage === "processing" ? "70%" : stage === "fetching" ? "30%" : "10%"
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Mock data loading steps */}
                        <div className="w-full space-y-2">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${stage !== "initial" ? "bg-green-500" : "bg-gray-300"}`}></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Connect to pollution sensors</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${stage === "processing" || stage === "rendering" ? "bg-green-500" : stage === "fetching" ? "bg-yellow-500 animate-pulse" : "bg-gray-300"}`}></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Download air quality data</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${stage === "rendering" ? "bg-green-500" : stage === "processing" ? "bg-yellow-500 animate-pulse" : "bg-gray-300"}`}></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Generate heatmap visualization</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}