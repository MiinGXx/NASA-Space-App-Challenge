// app/api/tempo/debug-settings/route.ts
import { NextResponse } from "next/server";

// List of known TEMPO product names to try
const KNOWN_TEMPO_PRODUCTS = [
    "TEMPO_L1B_RD",
    "TEMPO_L2_NO2",
    "TEMPO_L2_O3PR",
    "TEMPO-COLLGR",
    "TEMPO-L1B-DC",
    // Add more variations as you discover them
];

// In-memory storage for debug settings (will reset on server restart)
let debugSettings = {
    productName: KNOWN_TEMPO_PRODUCTS[0], // Start with the first product
    timeRange: 90, // Use an even longer time range by default (3 months)
    // Keep track of which products have been tried
    triedProducts: [] as string[],
    lastTried: new Date().toISOString(),
};

export async function GET() {
    // Check if we should try the next product (if it's been over 5 minutes since last try)
    const now = new Date();
    const lastTried = new Date(debugSettings.lastTried);
    const fiveMinutesMs = 5 * 60 * 1000;

    if (now.getTime() - lastTried.getTime() > fiveMinutesMs) {
        // If we've tried the current product without success, move to the next one
        if (!debugSettings.triedProducts.includes(debugSettings.productName)) {
            debugSettings.triedProducts.push(debugSettings.productName);
        }

        // Find a product we haven't tried yet
        const nextProduct = KNOWN_TEMPO_PRODUCTS.find(
            (product) => !debugSettings.triedProducts.includes(product)
        );

        // If we found a new product to try, update settings
        if (nextProduct) {
            debugSettings.productName = nextProduct;
            debugSettings.lastTried = now.toISOString();
            console.log(`🔄 Auto-rotating to next product: ${nextProduct}`);
        }
        // If we've tried all products, start over with a longer time range
        else if (
            debugSettings.triedProducts.length >= KNOWN_TEMPO_PRODUCTS.length
        ) {
            debugSettings.triedProducts = []; // Reset the tried products
            debugSettings.timeRange += 30; // Add 30 more days to search range
            debugSettings.productName = KNOWN_TEMPO_PRODUCTS[0]; // Start with first product again
            console.log(
                `🔄 Tried all products, increasing time range to ${debugSettings.timeRange} days`
            );
        }
    }

    return NextResponse.json({
        ...debugSettings,
        knownProducts: KNOWN_TEMPO_PRODUCTS,
        autoRotation: {
            enabled: true,
            lastTried,
            nextRotationAfter: new Date(
                lastTried.getTime() + fiveMinutesMs
            ).toISOString(),
        },
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (body.productName) {
            // If changing to a new product, add current product to tried list if not already there
            if (
                debugSettings.productName !== body.productName &&
                !debugSettings.triedProducts.includes(debugSettings.productName)
            ) {
                debugSettings.triedProducts.push(debugSettings.productName);
            }

            debugSettings.productName = body.productName;
            debugSettings.lastTried = new Date().toISOString();

            console.log(
                `🔧 Debug settings: Product name changed to ${body.productName}`
            );
        }

        if (typeof body.timeRange === "number" && body.timeRange > 0) {
            debugSettings.timeRange = body.timeRange;
            console.log(
                `🔧 Debug settings: Time range changed to ${body.timeRange} days`
            );
        }

        // Allow manual reset of tried products
        if (body.resetTriedProducts === true) {
            debugSettings.triedProducts = [];
            console.log("🔄 Reset list of tried products");
        }

        return NextResponse.json({
            success: true,
            settings: {
                ...debugSettings,
                knownProducts: KNOWN_TEMPO_PRODUCTS,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }
}
