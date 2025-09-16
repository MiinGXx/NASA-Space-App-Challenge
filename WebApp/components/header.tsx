import { ModeToggle } from "@/components/mode-toggle"
import { Wind } from "lucide-react"

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wind className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">AQI Forecast</h1>
            <p className="text-sm text-muted-foreground">Air Quality Monitoring</p>
          </div>
        </div>
        <ModeToggle />
      </div>
    </header>
  )
}
