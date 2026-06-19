import React from "react";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { Button } from "@/components/ui/button";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  category: string;
  image: string;
}

function getBlogPosts(): BlogPost[] {
  const blogDirectory = path.join(process.cwd(), "src/content/blog");
  
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(blogDirectory);
  const posts: BlogPost[] = [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".md")) continue;

    const slug = fileName.replace(/\.md$/, "");
    const filePath = path.join(blogDirectory, fileName);
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Parse simple frontmatter
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = fileContent.match(frontmatterRegex);
    const metadata: Record<string, string> = {};

    if (match) {
      const frontmatterBlock = match[1];
      const lines = frontmatterBlock.split("\n");
      for (const line of lines) {
        const colonIndex = line.indexOf(":");
        if (colonIndex > -1) {
          const key = line.substring(0, colonIndex).trim();
          const val = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, "");
          metadata[key] = val;
        }
      }
    }

    posts.push({
      slug,
      title: metadata.title || slug.replace(/-/g, " "),
      date: metadata.date || "2026-06-16",
      description: metadata.description || "",
      category: metadata.category || "general",
      image: metadata.image || "/assets/blog-placeholder.jpg",
    });
  }

  // Ordenar por fecha descendente
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const metadata = {
  title: "Blog Educativo | Clínica Dental Quantum",
  description: "Consejos, novedades y guías de salud dental explicadas por nuestros especialistas de Vitacura.",
};

const CATEGORIAS_TIQUETAS: Record<string, string> = {
  prevencion: "Cuidado Bucal",
  ortodoncia: "Ortodoncia",
  implantologia: "Implantes",
  estetica: "Estética",
  general: "General",
};

export default function BlogIndexPage() {
  const posts = getBlogPosts();

  return (
    <div className="py-12 container mx-auto px-4 max-w-5xl space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="font-heading text-4xl font-bold text-brand-navy">Blog de Salud Dental</h1>
        <p className="text-muted-foreground">
          Aprende a cuidar tu sonrisa con los artículos y guías de nuestros especialistas.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed rounded-xl">
          No hay artículos publicados por el momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article key={post.slug} className="border border-border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-between">
              <div className="space-y-4">
                {/* Image Placeholder */}
                <div className="h-48 w-full bg-slate-100 flex items-center justify-center text-slate-400 relative">
                  <div className="absolute inset-0 bg-brand-navy/5 flex items-center justify-center font-bold text-brand-navy text-3xl">
                    ✦
                  </div>
                  <span className="text-xs uppercase tracking-wider font-bold bg-white text-brand-navy px-3 py-1 rounded-full shadow-sm relative z-10">
                    {CATEGORIAS_TIQUETAS[post.category] || post.category}
                  </span>
                </div>

                <div className="p-6 space-y-2">
                  <span className="text-xs text-slate-400">{post.date}</span>
                  <h3 className="font-heading text-lg font-bold text-brand-navy hover:text-brand-turquoise transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-muted-foreground text-xs md:text-sm line-clamp-3 leading-relaxed">
                    {post.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link href={`/blog/${post.slug}`}>
                  <Button variant="outline" className="w-full text-xs border-slate-200">
                    Leer Artículo
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
