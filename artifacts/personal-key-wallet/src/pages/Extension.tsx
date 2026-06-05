import React from "react";
import { PuzzleIcon, Download, ShieldCheck, Zap, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Extension() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chrome Extension</h1>
        <p className="text-muted-foreground mt-1">Get your passwords everywhere you need them.</p>
      </div>

      <Card className="bg-card border-border overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <PuzzleIcon className="w-48 h-48" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <PuzzleIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Personal Key Wallet Extension</h2>
              <p className="text-muted-foreground text-lg">Auto-fill your secure credentials on any site.</p>
            </div>
          </div>

          <p className="mb-8 text-foreground/80 leading-relaxed max-w-2xl">
            Install the Personal Key Wallet Chrome Extension to get password suggestions on any website — just like RoboForm or 1Password. It connects directly to your secure vault.
          </p>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-lg">Installation Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click the <strong className="text-foreground">Download Extension</strong> button below</li>
              <li>Open Chrome and navigate to <strong className="text-foreground">chrome://extensions/</strong></li>
              <li>Enable <strong className="text-foreground">Developer mode</strong> (top right corner)</li>
              <li>Click <strong className="text-foreground">Load unpacked</strong> and select the downloaded, extracted folder</li>
              <li>Visit any website — the extension will automatically suggest your saved passwords</li>
            </ol>
          </div>

          <Button size="lg" className="w-full sm:w-auto" asChild>
            <a href="/api/extension/download" download>
              <Download className="mr-2 h-5 w-5" />
              Download Extension (ZIP)
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-6">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="font-semibold mb-2">Smart Detection</h4>
              <p className="text-sm text-muted-foreground">
                Automatically matches your saved passwords to the website you're visiting by domain.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h4 className="font-semibold mb-2">One-Click Fill</h4>
              <p className="text-sm text-muted-foreground">
                Copy your username and password with a single click, right from the extension popup.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <RefreshCw className="h-6 w-6" />
              </div>
              <h4 className="font-semibold mb-2">Always Synced</h4>
              <p className="text-sm text-muted-foreground">
                Uses your live vault via our secure API — no separate syncing process needed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
