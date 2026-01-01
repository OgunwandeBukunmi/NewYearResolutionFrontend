import { useState, useRef } from "react";
import { FiSend } from "react-icons/fi";
import { motion, useInView } from "framer-motion";
import { FiDownload } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

type Response = {
  type: "roadmap";
  title: string;
  summary: string;
  successRate: number;
  roadmap: {
    quarter: "Q1" | "Q2" | "Q3" | "Q4";
    months: string;
    goal: string;
    steps: {
      step: number;
      title: string;
      description: string;
    }[];
  }[];
  tips: {
    tip: string;
  }[];
  warnings: string[];
  reasonForSuccesRate: string;
};




export default function NewYearResolutionGuide() {

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [AiResponse, setAiResponse] = useState<Response | null>(null);
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, amount: 0.5 });
  const roadmapRef = useRef<HTMLDivElement>(null);
  const XRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null)
  const [Xloading, setXloading] = useState<boolean>(false)



  const exportToPDF = async () => {
    if (!roadmapRef.current) return;

    try {
      // Convert roadmap DOM to PNG
      const dataUrl = await toPng(roadmapRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff", // Force white background
      });

      // Create jsPDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [roadmapRef.current.offsetWidth, roadmapRef.current.offsetHeight],
      });

      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        0,
        roadmapRef.current.offsetWidth,
        roadmapRef.current.offsetHeight
      );

      pdf.save("2026-Resolution-Roadmap.pdf");
    } catch (err) {
      console.error("Error exporting PDF:", err);
    }
  };

  const exportToImage = async () => {
    if (!XRef.current) return;

    try {
      const dataUrl = await toPng(XRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff", // Force white background
      });

      return dataUrl;
    } catch (err) {
      console.error("Error exporting image:", err);
    }
  };

  const sharetoX = async () => {
    setXloading(true)
    const base64Image = await exportToImage()

    const res = await fetch("http://localhost:5000/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: base64Image,
        title: AiResponse?.title,
        summary: AiResponse?.summary,
      }),
    });

    const data = await res.json();
    console.log("Share URL:", data.shareUrl);
    setXloading(false)
    console.log("done")

    if (data.shareUrl) {
      const tweetText = encodeURIComponent(`Check out my 2026 Roadmap: ${AiResponse?.title}`);
      const tweetUrl = encodeURIComponent(data.shareUrl);
      window.open(`https://x.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, "_blank");
    }


  }


  const handleSend = async () => {
    setLoading(true);
    setError(null)
    try {
      const response = await fetch("http://localhost:5000/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      if (!data.error) {
        setAiResponse(data.response)
        console.log(data);
      } else {
        console.error("Error generating resolution:", data.error);
        setError(data.error)
      }


    } catch (error) {
      console.error("Error generating resolution:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  text-slate-900 font-sans ">
      {/* Background Blobs */}


      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col h-screen">
        {/* Header with Scroll Animation */}
        <motion.header
          ref={headerRef}
          initial={{ opacity: 0, y: -50 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg">

            <span className="text-sm font-semibold text-slate-600 tracking-wider">Your 2026 Journey Starts Here</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-tight">
            <span className="bg-clip-text text-transparent bg-blue-700">
              New Year
            </span>{" "}
            <span className="italic font-light text-slate-700">Resolution</span>{" "}
            <span className="font-black">Guide</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Chat with AI to craft, refine, and track your 2026 goals. Let's make this year legendary!
          </p>
        </motion.header>



        {/* Input Area */}
        <motion.div
          className="mt-6 flex gap-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <input
            type="text"
            placeholder="Share your goal or ask for advice..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-6 py-4 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="group flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold disabled:opacity-50 transition-all hover:shadow-lg active:scale-95"
          >
            <FiSend className="text-lg group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mt-10 max-w-3xl mx-auto md:p-4 "
          >
            <p className="text-red-500 text-center">{error} Wait a few minutes</p>
          </motion.div>
        )}


        {AiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mt-10 max-w-3xl mx-auto p-4 "
            ref={roadmapRef}
          >
            {/* Gradient Border */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl" />

            <div className="relative p-4 md:p-10 rounded-3xl bg-white/90 backdrop-blur border border-slate-200 shadow-2xl">

              {/* Header */}
              <div
                ref={XRef}
                className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-10 p-4">

                {/* Success Ring */}
                <div className="relative w-28 h-28 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-100"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={251.327}
                      strokeDashoffset={251.327 * (1 - AiResponse.successRate / 100)}
                      strokeLinecap="round"
                      className={`transition-all duration-1000 ${AiResponse.successRate < 40
                        ? "text-red-500"
                        : AiResponse.successRate < 60
                          ? "text-yellow-500"
                          : "text-emerald-500"
                        }`}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-900">
                      {AiResponse.successRate}%
                    </span>
                    <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                      Success
                    </span>
                  </div>
                </div>

                {/* Title & Summary */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-slate-100 text-slate-600">
                    {AiResponse.type === "roadmap" ? "Action Roadmap" : "Strategic Advice"}
                  </span>

                  <h2 className="text-3xl font-black text-slate-900 leading-tight">
                    {AiResponse.title}
                  </h2>

                  <p className="text-slate-600 italic leading-relaxed max-w-xl">
                    “{AiResponse.summary}”
                  </p>


                </div>

              </div>


              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-600 mb-8">
                <span className="font-bold text-slate-800">AI Analysis:</span>{" "}
                {AiResponse.reasonForSuccesRate}
              </div>

              {/* Content */}
              <div className="space-y-10">

                {/* Steps */}
                {AiResponse?.roadmap && AiResponse?.roadmap.length > 0 && (
                  <div className="space-y-14">

                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 text-center">
                      12-Month Strategic Execution Plan
                    </h3>

                    <div className="space-y-12">
                      {AiResponse.roadmap.map((quarter, qIndex) => (
                        <div
                          key={qIndex}
                          className="relative p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200 shadow-xl"
                        >
                          {/* Soft Glow */}
                          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-2xl -z-10" />

                          {/* Quarter Header */}
                          <div className="flex flex-col gap-4 mb-10">
                            <div className="flex flex-wrap items-center gap-4">
                              <span className="px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
                                {quarter.quarter}
                              </span>

                              <span className="px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-slate-100 text-slate-600">
                                {quarter.months}
                              </span>
                            </div>

                            <h4 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight max-w-2xl">
                              {quarter.goal}
                            </h4>
                          </div>

                          {/* Steps Timeline */}
                          <div className="relative space-y-6 pl-6">
                            {/* Vertical Line */}
                            <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/40 via-purple-500/40 to-transparent" />

                            {quarter.steps.map((step, i) => (
                              <div
                                key={i}
                                className="relative flex gap-6 p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all"
                              >
                                {/* Step Indicator */}
                                <div className="relative z-10 w-10 h-10 flex items-center justify-center rounded-full bg-purple-500 text-white text-sm font-black shadow-md">
                                  {step.step}
                                </div>

                                {/* Step Content */}
                                <div className="space-y-2">
                                  <p className="text-slate-900 font-bold text-base">
                                    {step.title}
                                  </p>
                                  <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {AiResponse.tips && AiResponse.tips?.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
                      Expert Tips
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                      {AiResponse.tips.map((tip, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100"
                        >
                          <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <p className="text-sm text-emerald-900">{tip.tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {AiResponse.warnings && AiResponse.warnings.length > 0 && (
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                    <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                      ⚠️ Potential Obstacles
                    </h3>
                    <ul className="space-y-2">
                      {AiResponse.warnings.map((warning: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-amber-900 leading-relaxed font-medium"
                        >
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}


        {AiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={exportToPDF}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white/60 backdrop-blur-xl border border-white/40 text-slate-800 font-bold shadow-xl hover:bg-white/80 transition-all active:scale-95">
              <FiDownload className="text-xl text-blue-600" />
              Download Plan
            </button>
            <button
              onClick={sharetoX}
              disabled={Xloading}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-slate-900 backdrop-blur-xl disabled:opacity-50 border border-white/10 text-white font-bold shadow-xl hover:bg-slate-900 transition-all active:scale-95">
              <FaXTwitter className="text-xl" />
              Share Journey
            </button>
          </motion.div>
        )}

        {/* Footer */}
        <motion.footer
          className="mt-8 text-center text-slate-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Powered by AI • Free for Dreamers • © 2026 Resolution Guide
        </motion.footer>
      </main>
    </div>
  );
}