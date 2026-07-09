import { useState, useEffect, useRef } from "react";
import { useGetCv, useUpsertCv } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Save, Printer, ChevronDown, ChevronUp,
  User, Briefcase, GraduationCap, Star, Globe, Phone,
  Mail, MapPin, Linkedin, Link, Check,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
interface ExpItem { id: string; company: string; position: string; location: string; startDate: string; endDate: string; current: boolean; description: string; }
interface EduItem { id: string; institution: string; degree: string; field: string; startDate: string; endDate: string; grade: string; }
interface SkillItem { id: string; name: string; level: string; }
interface LangItem { id: string; name: string; proficiency: string; }

interface CvData {
  fullName: string; jobTitle: string; email: string; phone: string; address: string;
  website: string; linkedin: string; summary: string;
  experience: ExpItem[]; education: EduItem[]; skills: SkillItem[]; languages: LangItem[];
  templateColor: string;
}

const EMPTY: CvData = {
  fullName: "", jobTitle: "", email: "", phone: "", address: "",
  website: "", linkedin: "", summary: "",
  experience: [], education: [], skills: [], languages: [],
  templateColor: "#0078D4",
};

const COLORS = ["#0078D4","#107C10","#C50F1F","#7719AA","#038387","#CA5010","#1B6EC2","#8764B8"];

function uid() { return Math.random().toString(36).slice(2, 9); }

// ── Section toggle ────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean; }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-[13.5px] font-semibold text-foreground">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-3 bg-white">{children}</div>}
    </div>
  );
}

// ── CV Preview ────────────────────────────────────────────────────────
function CVPreview({ cv }: { cv: CvData }) {
  const color = cv.templateColor;
  return (
    <div id="cv-print-area" className="bg-white text-[#1a1a1a] font-sans" style={{ fontFamily: "'Arial', sans-serif", fontSize: 11, lineHeight: 1.5 }}>
      {/* Header */}
      <div style={{ background: color, color: "#fff", padding: "28px 32px 22px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>{cv.fullName || "Your Name"}</h1>
        <p style={{ fontSize: 13, marginTop: 4, opacity: 0.92, fontWeight: 500 }}>{cv.jobTitle || "Job Title"}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", marginTop: 12, fontSize: 10.5, opacity: 0.9 }}>
          {cv.email && <span>✉ {cv.email}</span>}
          {cv.phone && <span>📞 {cv.phone}</span>}
          {cv.address && <span>📍 {cv.address}</span>}
          {cv.website && <span>🌐 {cv.website}</span>}
          {cv.linkedin && <span>in {cv.linkedin}</span>}
        </div>
      </div>

      <div style={{ padding: "20px 32px", display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* Left column */}
        <div>
          {/* Summary */}
          {cv.summary && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${color}`, paddingBottom: 4, marginBottom: 8 }}>Profile Summary</h2>
              <p style={{ fontSize: 10.5, color: "#444", lineHeight: 1.6 }}>{cv.summary}</p>
            </div>
          )}

          {/* Experience */}
          {cv.experience.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${color}`, paddingBottom: 4, marginBottom: 10 }}>Work Experience</h2>
              {cv.experience.map((exp) => (
                <div key={exp.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: 11.5, fontWeight: 700, margin: 0 }}>{exp.position || "Position"}</p>
                      <p style={{ fontSize: 10.5, color: "#555", margin: "1px 0" }}>{exp.company}{exp.location ? ` — ${exp.location}` : ""}</p>
                    </div>
                    <p style={{ fontSize: 10, color: "#888", whiteSpace: "nowrap", marginLeft: 8 }}>
                      {exp.startDate && `${exp.startDate} – ${exp.current ? "Present" : exp.endDate || ""}`}
                    </p>
                  </div>
                  {exp.description && <p style={{ fontSize: 10.5, color: "#555", marginTop: 4, lineHeight: 1.5 }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {cv.education.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${color}`, paddingBottom: 4, marginBottom: 10 }}>Education</h2>
              {cv.education.map((edu) => (
                <div key={edu.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: 11.5, fontWeight: 700, margin: 0 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</p>
                      <p style={{ fontSize: 10.5, color: "#555", margin: "1px 0" }}>{edu.institution}</p>
                      {edu.grade && <p style={{ fontSize: 10, color: "#888", margin: "1px 0" }}>Grade: {edu.grade}</p>}
                    </div>
                    <p style={{ fontSize: 10, color: "#888", whiteSpace: "nowrap", marginLeft: 8 }}>
                      {edu.startDate && `${edu.startDate} – ${edu.endDate || "Present"}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div>
          {/* Skills */}
          {cv.skills.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${color}`, paddingBottom: 4, marginBottom: 8 }}>Skills</h2>
              {cv.skills.map((sk) => (
                <div key={sk.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600 }}>{sk.name}</span>
                    <span style={{ fontSize: 9.5, color: "#888" }}>{sk.level}</span>
                  </div>
                  <div style={{ height: 4, background: "#eee", borderRadius: 2 }}>
                    <div style={{ height: 4, background: color, borderRadius: 2, width: sk.level === "Expert" ? "95%" : sk.level === "Advanced" ? "80%" : sk.level === "Intermediate" ? "60%" : "35%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {cv.languages.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${color}`, paddingBottom: 4, marginBottom: 8 }}>Languages</h2>
              {cv.languages.map((lang) => (
                <div key={lang.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600 }}>{lang.name}</span>
                  <span style={{ fontSize: 10, color: "#888" }}>{lang.proficiency}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function CVBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cv, setCv] = useState<CvData>(EMPTY);
  const [saved, setSaved] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: existing, isLoading } = useGetCv();
  const upsert = useUpsertCv();

  useEffect(() => {
    if (existing) {
      setCv({
        fullName: existing.fullName, jobTitle: existing.jobTitle,
        email: existing.email, phone: existing.phone, address: existing.address,
        website: existing.website ?? "", linkedin: existing.linkedin ?? "",
        summary: existing.summary ?? "",
        experience: safeJson(existing.experience),
        education: safeJson(existing.education),
        skills: safeJson(existing.skills),
        languages: safeJson(existing.languages),
        templateColor: existing.templateColor,
      });
    } else if (!isLoading && user) {
      setCv((prev) => ({ ...prev, fullName: user.name ?? "", email: user.email ?? "", phone: user.phone ?? "", address: user.address ?? "" }));
    }
  }, [existing, isLoading, user]);

  function safeJson<T>(str: string): T[] {
    try { return JSON.parse(str) as T[]; } catch { return []; }
  }

  function set<K extends keyof CvData>(key: K, val: CvData[K]) {
    setCv((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  function handleSave() {
    upsert.mutate({
      data: {
        ...cv,
        experience: JSON.stringify(cv.experience),
        education: JSON.stringify(cv.education),
        skills: JSON.stringify(cv.skills),
        languages: JSON.stringify(cv.languages),
      },
    }, {
      onSuccess: () => { setSaved(true); toast({ title: "CV saved!", description: "Your CV has been saved successfully." }); },
      onError: () => toast({ title: "Error", description: "Could not save CV.", variant: "destructive" }),
    });
  }

  function handlePrint() {
    const printContent = document.getElementById("cv-print-area");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${cv.fullName || "CV"} - Resume</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: white; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>${printContent.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  // Experience helpers
  const addExp = () => set("experience", [...cv.experience, { id: uid(), company: "", position: "", location: "", startDate: "", endDate: "", current: false, description: "" }]);
  const updateExp = (id: string, k: keyof ExpItem, v: string | boolean) => set("experience", cv.experience.map((e) => e.id === id ? { ...e, [k]: v } : e));
  const removeExp = (id: string) => set("experience", cv.experience.filter((e) => e.id !== id));

  // Education helpers
  const addEdu = () => set("education", [...cv.education, { id: uid(), institution: "", degree: "", field: "", startDate: "", endDate: "", grade: "" }]);
  const updateEdu = (id: string, k: keyof EduItem, v: string) => set("education", cv.education.map((e) => e.id === id ? { ...e, [k]: v } : e));
  const removeEdu = (id: string) => set("education", cv.education.filter((e) => e.id !== id));

  // Skill helpers
  const addSkill = () => set("skills", [...cv.skills, { id: uid(), name: "", level: "Intermediate" }]);
  const updateSkill = (id: string, k: keyof SkillItem, v: string) => set("skills", cv.skills.map((s) => s.id === id ? { ...s, [k]: v } : s));
  const removeSkill = (id: string) => set("skills", cv.skills.filter((s) => s.id !== id));

  // Language helpers
  const addLang = () => set("languages", [...cv.languages, { id: uid(), name: "", proficiency: "Conversational" }]);
  const updateLang = (id: string, k: keyof LangItem, v: string) => set("languages", cv.languages.map((l) => l.id === id ? { ...l, [k]: v } : l));
  const removeLang = (id: string) => set("languages", cv.languages.filter((l) => l.id !== id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CV Builder</h1>
          <p className="text-muted-foreground text-[13.5px]">Create your professional resume — live preview, PDF export</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </Button>
          <Button size="sm" onClick={handleSave} disabled={upsert.isPending} className="gap-1.5">
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {upsert.isPending ? "Saving…" : saved ? "Saved!" : "Save CV"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ── Left: Form ── */}
        <div className="space-y-3">
          {/* Color picker */}
          <Card className="bg-white border-border p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[12.5px] font-semibold text-foreground shrink-0">Template Color:</p>
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => set("templateColor", c)}
                  className="h-7 w-7 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: cv.templateColor === c ? "#111" : "transparent", transform: cv.templateColor === c ? "scale(1.2)" : "scale(1)" }}
                />
              ))}
            </div>
          </Card>

          {/* Personal Info */}
          <Section title="Personal Information" icon={User}>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-[12px]">Full Name *</Label>
                <Input value={cv.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Aakash Adhikari" className="h-8 text-[12.5px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]">Job Title *</Label>
                <Input value={cv.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} placeholder="Bank Officer" className="h-8 text-[12.5px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]"><Phone className="h-3 w-3 inline mr-1" />Phone</Label>
                <Input value={cv.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+977-98XXXXXXXX" className="h-8 text-[12.5px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]"><Mail className="h-3 w-3 inline mr-1" />Email</Label>
                <Input value={cv.email} onChange={(e) => set("email", e.target.value)} placeholder="you@gmail.com" className="h-8 text-[12.5px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]"><MapPin className="h-3 w-3 inline mr-1" />Address</Label>
                <Input value={cv.address} onChange={(e) => set("address", e.target.value)} placeholder="Kathmandu, Nepal" className="h-8 text-[12.5px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]"><Globe className="h-3 w-3 inline mr-1" />Website</Label>
                <Input value={cv.website} onChange={(e) => set("website", e.target.value)} placeholder="yourwebsite.com" className="h-8 text-[12.5px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]"><Linkedin className="h-3 w-3 inline mr-1" />LinkedIn</Label>
                <Input value={cv.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/you" className="h-8 text-[12.5px]" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-[12px]">Profile Summary</Label>
                <Textarea value={cv.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Results-driven banking professional with 5+ years of experience in retail banking and customer service…" className="text-[12.5px] resize-none h-20" />
              </div>
            </div>
          </Section>

          {/* Experience */}
          <Section title="Work Experience" icon={Briefcase}>
            {cv.experience.map((exp, i) => (
              <div key={exp.id} className="border border-border/70 rounded-lg p-3 space-y-2 bg-muted/10">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">Position {i + 1}</Badge>
                  <button type="button" onClick={() => removeExp(exp.id)} className="text-destructive hover:text-destructive/80 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[11px]">Company *</Label>
                    <Input value={exp.company} onChange={(e) => updateExp(exp.id, "company", e.target.value)} placeholder="NIC Asia Bank" className="h-7 text-[12px]" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px]">Position *</Label>
                    <Input value={exp.position} onChange={(e) => updateExp(exp.id, "position", e.target.value)} placeholder="Branch Officer" className="h-7 text-[12px]" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px]">Location</Label>
                    <Input value={exp.location} onChange={(e) => updateExp(exp.id, "location", e.target.value)} placeholder="Kathmandu" className="h-7 text-[12px]" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px]">Start Date</Label>
                    <Input value={exp.startDate} onChange={(e) => updateExp(exp.id, "startDate", e.target.value)} placeholder="Jan 2020" className="h-7 text-[12px]" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px]">End Date</Label>
                    <Input value={exp.endDate} onChange={(e) => updateExp(exp.id, "endDate", e.target.value)} placeholder="Dec 2023" disabled={exp.current} className="h-7 text-[12px]" />
                  </div>
                  <div className="flex items-end pb-1 gap-2">
                    <input type="checkbox" id={`cur-${exp.id}`} checked={exp.current} onChange={(e) => updateExp(exp.id, "current", e.target.checked)} className="accent-primary" />
                    <Label htmlFor={`cur-${exp.id}`} className="text-[11.5px] cursor-pointer">Currently working</Label>
                  </div>
                  <div className="col-span-2 space-y-0.5">
                    <Label className="text-[11px]">Description / Responsibilities</Label>
                    <Textarea value={exp.description} onChange={(e) => updateExp(exp.id, "description", e.target.value)} placeholder="• Managed daily banking operations and customer accounts&#10;• Processed loan applications and KYC documentation" className="h-16 text-[12px] resize-none" />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={addExp} className="w-full gap-1.5 text-[12.5px] h-8">
              <Plus className="h-3.5 w-3.5" /> Add Experience
            </Button>
          </Section>

          {/* Education */}
          <Section title="Education" icon={GraduationCap}>
            {cv.education.map((edu, i) => (
              <div key={edu.id} className="border border-border/70 rounded-lg p-3 space-y-2 bg-muted/10">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">Education {i + 1}</Badge>
                  <button type="button" onClick={() => removeEdu(edu.id)} className="text-destructive hover:text-destructive/80 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 space-y-0.5">
                    <Label className="text-[11px]">Institution *</Label>
                    <Input value={edu.institution} onChange={(e) => updateEdu(edu.id, "institution", e.target.value)} placeholder="Tribhuvan University" className="h-7 text-[12px]" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px]">Degree</Label>
                    <Input value={edu.degree} onChange={(e) => updateEdu(edu.id, "degree", e.target.value)} placeholder="Bachelor's" className="h-7 text-[12px]" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px]">Field of Study</Label>
                    <Input value={edu.field} onChange={(e) => updateEdu(edu.id, "field", e.target.value)} placeholder="Business Administration" className="h-7 text-[12px]" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px]">Start Year</Label>
                    <Input value={edu.startDate} onChange={(e) => updateEdu(edu.id, "startDate", e.target.value)} placeholder="2016" className="h-7 text-[12px]" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px]">End Year</Label>
                    <Input value={edu.endDate} onChange={(e) => updateEdu(edu.id, "endDate", e.target.value)} placeholder="2020" className="h-7 text-[12px]" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px]">Grade / GPA</Label>
                    <Input value={edu.grade} onChange={(e) => updateEdu(edu.id, "grade", e.target.value)} placeholder="3.5 GPA / 65%" className="h-7 text-[12px]" />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={addEdu} className="w-full gap-1.5 text-[12.5px] h-8">
              <Plus className="h-3.5 w-3.5" /> Add Education
            </Button>
          </Section>

          {/* Skills */}
          <Section title="Skills" icon={Star} defaultOpen={false}>
            <div className="space-y-2">
              {cv.skills.map((sk) => (
                <div key={sk.id} className="flex items-center gap-2">
                  <Input value={sk.name} onChange={(e) => updateSkill(sk.id, "name", e.target.value)} placeholder="Skill name" className="h-8 text-[12.5px] flex-1" />
                  <select value={sk.level} onChange={(e) => updateSkill(sk.id, "level", e.target.value)}
                    className="h-8 text-[12px] border border-border rounded-md px-2 bg-white text-foreground shrink-0">
                    {["Beginner","Intermediate","Advanced","Expert"].map((l) => <option key={l}>{l}</option>)}
                  </select>
                  <button type="button" onClick={() => removeSkill(sk.id)} className="text-destructive p-1 shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addSkill} className="w-full gap-1.5 text-[12.5px] h-8">
              <Plus className="h-3.5 w-3.5" /> Add Skill
            </Button>
          </Section>

          {/* Languages */}
          <Section title="Languages" icon={Globe} defaultOpen={false}>
            <div className="space-y-2">
              {cv.languages.map((lang) => (
                <div key={lang.id} className="flex items-center gap-2">
                  <Input value={lang.name} onChange={(e) => updateLang(lang.id, "name", e.target.value)} placeholder="e.g. Nepali" className="h-8 text-[12.5px] flex-1" />
                  <select value={lang.proficiency} onChange={(e) => updateLang(lang.id, "proficiency", e.target.value)}
                    className="h-8 text-[12px] border border-border rounded-md px-2 bg-white text-foreground shrink-0">
                    {["Native","Fluent","Conversational","Basic"].map((l) => <option key={l}>{l}</option>)}
                  </select>
                  <button type="button" onClick={() => removeLang(lang.id)} className="text-destructive p-1 shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addLang} className="w-full gap-1.5 text-[12.5px] h-8">
              <Plus className="h-3.5 w-3.5" /> Add Language
            </Button>
          </Section>
        </div>

        {/* ── Right: Preview ── */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-foreground">Live Preview</p>
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-[12px]">
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </Button>
          </div>
          <div className="border border-border rounded-xl overflow-hidden shadow-sm" style={{ maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
            <div ref={printRef}>
              <CVPreview cv={cv} />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            💡 Click "Print / PDF" → Save as PDF to share or submit your CV
          </p>
        </div>
      </div>
    </div>
  );
}
