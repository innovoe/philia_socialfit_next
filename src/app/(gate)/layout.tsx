import { GateExtras } from "@/components/gate/GateExtras";

export default function GateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-stage">
      <div className="phone-screen">
        {children}
        <GateExtras />
      </div>
    </div>
  );
}
