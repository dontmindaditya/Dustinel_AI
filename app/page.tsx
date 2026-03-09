"use client";

import { motion } from "framer-motion";
import { globalStyles } from "@/lib/styles";

import { Header }         from "@/app/landingpage/Header";
import { Hero }           from "@/app/landingpage/Hero";
import { ImageStrip }     from "@/app/landingpage/ImageStrip";
import { Features }       from "@/app/landingpage/Features";
import { HowItWorks }     from "@/app/landingpage/HowItWorks";
import { RiskLevels }     from "@/app/landingpage/RiskLevels";
import { ResearchPapers } from "@/app/landingpage/ResearchPapers";
import { CTA }            from "@/app/landingpage/CTA";
import { Footer }         from "@/app/landingpage/Footer";

export default function HomePage() {
  return (
    <>
      <style>{globalStyles}</style>

      <motion.div
        style={{ background: "var(--bg)", minHeight: "100vh" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <Header />
        <Hero />
        <ImageStrip />
        <Features />
        <HowItWorks />
        <RiskLevels />
        <ResearchPapers />
        <CTA />
        <Footer />
      </motion.div>
    </>
  );
}