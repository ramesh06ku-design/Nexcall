"use client";
import { motion } from "framer-motion";
export function MotionReveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) { return <motion.div className={className} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>; }
