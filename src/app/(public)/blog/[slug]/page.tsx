import React from "react";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

// Generar rutas estáticas
export async function generateStaticParams() {
  const blogDirectory = path.join(process.cwd(), "src/content/blog");
  
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(blogDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => ({
      slug: fileName.replace(/\.md$/, ""),
    }));
}

// Metadatos dinámicos
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const filePath = path.join(process.cwd(), "src/content/blog", `${params.slug}.md`);
  
  if (!fs.existsSync(filePath)) {
    return { title: "Artículo no encontrado" };
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = fileContent.match(frontmatterRegex);
  const metadata: Record<string, string> = {};

  if (match) {
    const lines = match[1].split("\n");
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex).trim();
        const val = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
        metadata[key] = val;
      }
    }
  }

  return {
    title: `${metadata.title || "Artículo"} | Blog Clínica Dental Quantum`,
    description: metadata.description || "Artículo educativo de salud dental en Vitacura.",
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const filePath = path.join(process.cwd(), "src/content/blog", `${params.slug}.md`);

  if (!fs.existsSync(filePath)) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-brand-navy">Artículo No Encontrado</h1>
        <p className="text-muted-foreground">El artículo que busca no existe o fue removido.</p>
        <Link href="/blog">
          <Button variant="outline">Volver al Blog</Button>
        </Link>
      </div>
    );
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  
  // Extraer frontmatter y contenido
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = fileContent.match(frontmatterRegex);
  const metadata: Record<string, string> = {};
  let markdownContent = fileContent;

  if (match) {
    markdownContent = fileContent.replace(match[0], "");
    const lines = match[1].split("\n");
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex).trim();
        const val = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
        metadata[key] = val;
      }
    }
  }

  // Parsear Markdown a HTML
  const htmlContent = await marked.parse(markdownContent);

  return (
    <article className="py-12 container mx-auto px-4 max-w-3xl space-y-8">
      {/* Back button */}
      <div>
        <Link href="/blog" className="text-sm text-brand-turquoise hover:underline">
          ← Volver al Blog
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-turquoise bg-brand-turquoise/10 px-2.5 py-1 rounded-full">
          {metadata.category || "General"}
        </span>
        <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-brand-navy leading-tight">
          {metadata.title}
        </h1>
        <div className="text-xs text-slate-400 flex gap-4">
          <span>Fecha: {metadata.date}</span>
          <span>Por: Especialistas Dental Quantum</span>
        </div>
      </div>

      {/* Article Body */}
      <div 
        className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:text-brand-navy prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-sm md:prose-p:text-base prose-li:text-slate-700 prose-li:text-sm md:prose-li:text-base hover:prose-a:text-brand-turquoise"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Footer CTA */}
      <div className="border-t border-border pt-8 mt-12 text-center space-y-4 bg-slate-50 p-8 rounded-xl">
        <h3 className="font-heading text-xl font-bold text-brand-navy">¿Requiere una evaluación dental?</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Reserve una hora directamente con nuestros especialistas en Vitacura.
        </p>
        <Link href="/agendar" className="inline-block mt-2">
          <Button className="bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold">
            Agendar Hora Online
          </Button>
        </Link>
      </div>
    </article>
  );
}
