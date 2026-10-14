import Link from "next/link";
import Brand from "@/components/brand";
import { DEVELOPER, SYNTHETIC_DATA_DISCLOSURE } from "@/lib/site-config";
import { Mail } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="forge-dark forge-dark-gradient mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Brand theme="dark" />
            <p className="mt-4 text-[13px] text-[#94A3B8] max-w-md leading-relaxed">
              Full-stack development and AI workflow engineering. Building practical applications that
              connect data, automate repetitive work, and make complex processes easier to manage.
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-3">
              Explore
            </h3>
            <ul className="space-y-2 text-[13px] text-[#CBD5E1]">
              <li><Link href="/#workflow" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/demo" className="hover:text-white transition-colors">Working Demo</Link></li>
              <li><Link href="/case-study" className="hover:text-white transition-colors">Engineering Case Study</Link></li>
              <li><Link href="/engineering" className="hover:text-white transition-colors">Technical Overview</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-3">
              Contact
            </h3>
            <ul className="space-y-2 text-[13px] text-[#CBD5E1]">
              <li>
                <a
                  href={`mailto:${DEVELOPER.links.email}`}
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5" /> {DEVELOPER.links.email}
                </a>
              </li>
              <li><Link href="/#about" className="hover:text-white transition-colors">About {DEVELOPER.name}</Link></li>
              <li><Link href="/#contact" className="hover:text-white transition-colors">Discuss a project</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[11px] text-[#64748B] max-w-2xl leading-relaxed">
            {SYNTHETIC_DATA_DISCLOSURE}
          </p>
          <p className="text-[11px] text-[#475569] shrink-0 font-mono">
            © {new Date().getFullYear()} {DEVELOPER.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
