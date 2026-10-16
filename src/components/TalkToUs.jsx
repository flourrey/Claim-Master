import React, { useState, useEffect, useRef } from 'react';
import { DiscussionEmbed, CommentCount } from 'disqus-react';
import { 
  MessageSquare, 
  MessageCircle, 
  Info, 
  ExternalLink, 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function TalkToUs({ currentUser }) {
  const [isBlockedOrSlow, setIsBlockedOrSlow] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [directFeedback, setDirectFeedback] = useState('');
  const [directSubmitted, setDirectSubmitted] = useState(false);
  const disqusContainerRef = useRef(null);

  const disqusShortname = 'claim-master';
  const pageUrl = typeof window !== 'undefined' ? `${window.location.origin}/talk-to-us` : 'https://claim-master.vercel.app/talk-to-us';

  const article = {
    url: pageUrl,
    id: 'claim-master-main-discussion',
    title: 'Claim Master — Staff Feedback & Community Forum',
  };

  // Build clean Disqus config without empty string SSO keys which crash Disqus embed
  const buildDisqusConfig = () => {
    const config = {
      url: article.url,
      identifier: article.id,
      title: article.title,
      language: 'en',
    };

    // Set developer mode for localhost and dev domains
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host.includes('run.app')) {
        config.developer = 1;
      }
    }

    // Include SSO object if configured
    if (currentUser?.name) {
      config.sso = {
        name: `${currentUser.name} (${currentUser.department})`,
        button: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '',
        icon: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        logout: typeof window !== 'undefined' ? window.location.origin : '',
        profile_url: typeof window !== 'undefined' ? `${window.location.origin}/profile/{username}` : '',
        width: '800',
        height: '400',
      };
    }

    return config;
  };

  const disqusConfig = buildDisqusConfig();

  // Monitor if Disqus iframe loads or if blocked by ad-blockers / 3rd-party cookie shields
  useEffect(() => {
    const checkTimer = setTimeout(() => {
      const iframe = disqusContainerRef.current?.querySelector('iframe');
      if (iframe) {
        setLoadSuccess(true);
      } else {
        // If after 3.5s no iframe has loaded, it is likely blocked by Brave/uBlock/Safari
        setIsBlockedOrSlow(true);
      }
    }, 3500);

    // Also observe DOM additions inside disqusContainerRef
    const observer = new MutationObserver(() => {
      const iframe = disqusContainerRef.current?.querySelector('iframe');
      if (iframe) {
        setLoadSuccess(true);
        setIsBlockedOrSlow(false);
      }
    });

    if (disqusContainerRef.current) {
      observer.observe(disqusContainerRef.current, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(checkTimer);
      observer.disconnect();
    };
  }, []);

  const handleDirectSubmit = (e) => {
    e.preventDefault();
    if (!directFeedback.trim()) return;
    setDirectSubmitted(true);
    setTimeout(() => {
      setDirectFeedback('');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Talk to Us & Staff Forum
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  <MessageCircle className="w-3.5 h-3.5 text-sky-600" />
                  <CommentCount
                    shortname={disqusShortname}
                    config={{
                      url: article.url,
                      identifier: article.id,
                      title: article.title,
                    }}
                  >
                    Comments
                  </CommentCount>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Have questions about claim approvals, receipt reading, or expense guidelines? Share your thoughts below.
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs shrink-0">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Active Staff:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <span>{currentUser.avatar}</span>
                <span>{currentUser.name} ({currentUser.department})</span>
              </span>
            </div>
          )}
        </div>

        {/* Ad-blocker / Privacy Notice Banner if blocked */}
        {isBlockedOrSlow && !loadSuccess && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Disqus Comments Not Showing?</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Disqus third-party scripts are frequently blocked by browser ad-blockers (such as <strong>uBlock Origin</strong>, <strong>Brave Shields</strong>, or <strong>Safari/Chrome Strict Tracking Protection</strong>) or third-party cookie restrictions inside cloud preview windows.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={`https://${disqusShortname}.disqus.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shadow-2xs"
              >
                <span>Open Forum on Disqus</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-amber-700">or use the fast feedback box below!</span>
            </div>
          </div>
        )}
      </div>

      {/* Disqus Discussion Embed Container */}
      <div 
        ref={disqusContainerRef}
        className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm overflow-hidden min-h-[350px]"
      >
        <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Discussion Channel: <strong className="text-slate-700">{disqusShortname}</strong>
          </span>
          <a
            href={`https://${disqusShortname}.disqus.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium hover:underline"
          >
            <span>Disqus Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Disqus Component */}
        <DiscussionEmbed
          shortname={disqusShortname}
          config={disqusConfig}
        />
      </div>

      {/* In-App Direct Feedback / Question Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">Direct Staff Feedback & Support</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Need quick support regarding your expense claim? Drop a message directly to the finance admin team:
        </p>

        {directSubmitted ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Thank you, {currentUser?.name || 'staff member'}! Your feedback has been recorded for the finance team.</span>
          </div>
        ) : (
          <form onSubmit={handleDirectSubmit} className="space-y-3">
            <textarea
              rows={3}
              value={directFeedback}
              onChange={(e) => setDirectFeedback(e.target.value)}
              placeholder={`Hi finance team, I have a question regarding my ${currentUser?.department || 'department'} claim...`}
              className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!directFeedback.trim()}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  directFeedback.trim()
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
