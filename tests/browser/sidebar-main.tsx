/** Renders an application shell with the animated sidebar in its default icon-rail mode. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ChevronsUpDown, FolderKanban, Home, Settings } from "lucide-react";
import {
  AccountMenu,
  AstraUIProvider,
  Sidebar,
  SidebarBrandButton,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@astra-kit/ui";
import "./styles.css";

const SECTIONS = [
  { name: "Inicio", icon: <Home /> },
  { name: "Ajustes", icon: <Settings /> },
] as const;
const PROJECTS = ["Astra", "Agenda"] as const;

/** Keeps the selected section in state so navigation can be observed without a router. */
function SidebarShell() {
  const [section, setSection] = useState<string>("Inicio");
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  return (
    <AstraUIProvider>
      <SidebarProvider>
        <Sidebar ariaLabel="Navegación principal">
          <SidebarHeader>
            <SidebarBrandButton icon={<span>BZ</span>} trailing={<ChevronsUpDown />}>
              Astra
            </SidebarBrandButton>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Secciones</SidebarGroupLabel>
              <SidebarMenu>
                {SECTIONS.map(({ name, icon }) => (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton icon={icon} isActive={section === name} onSelect={() => setSection(name)}>
                      {name}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<FolderKanban />}
                    ariaExpanded={isProjectsOpen}
                    onSelect={() => setIsProjectsOpen((isOpen) => !isOpen)}
                  >
                    Proyectos
                  </SidebarMenuButton>
                  <SidebarMenuSub open={isProjectsOpen}>
                    {PROJECTS.map((project) => (
                      <SidebarMenuSubItem key={project}>
                        <SidebarMenuSubButton isActive={section === project} onSelect={() => setSection(project)}>
                          {project}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarLabel asChild>
              <p>Elegí una sección para empezar.</p>
            </SidebarLabel>
          </SidebarContent>
          <SidebarFooter>
            <AccountMenu
              name="Ana López"
              email="ana@example.com"
              status="authenticated"
              triggerVariant="sidebar"
              onSignOut={() => undefined}
            />
          </SidebarFooter>
          <SidebarRail aria-label="Borde de la navegación" />
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger aria-label="Alternar navegación" />
          <output aria-label="Sección activa">{section}</output>
          <div style={{ height: "200vh" }} />
        </SidebarInset>
      </SidebarProvider>
    </AstraUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<SidebarShell />);
