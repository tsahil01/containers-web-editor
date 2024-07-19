"use client";

import { cn } from "@/lib/utils";
import { Inter as FontSans } from "next/font/google";
import { RecoilRoot } from "recoil";


const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
  });

export default function Layout({
    children
    }: Readonly<{
    children: React.ReactNode;
    }>) {
    return (
        <html lang="en">
        <body
            className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
            )}
        >
            <RecoilRoot>{children}</RecoilRoot>
        </body>
        </html>
    );
    }