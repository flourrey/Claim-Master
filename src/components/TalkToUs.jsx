import React, { useState, useEffect } from 'react';
import { DiscussionEmbed, CommentCount } from 'disqus-react';
import { MessageSquare, MessageCircle, Info, Sparkles, ShieldCheck } from 'lucide-react';

export default function TalkToUs({ currentUser }) {
  const [pageUrl, setPageUrl] = useState('https://claim-master.vercel.app/talk-to-us');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setPageUrl(`${window.location.origin}/talk-to-us`);
    }
  }, []);

  const article = {
    url: pageUrl,
    id: 'claim-master-main-discussion',
    title: 'Claim Master — Staff Feedback & Community Forum',
  };

  const disqusShortname = 'claim-master';

  // Disqus configuration with Discussion, CommentCount, and SSO support
  const disqusConfig = {
    url: article.url,
    identifier: article.id,
    title: article.title,
    language: 'en',
    // SSO configuration
    remoteAuthS3: '', // Can be populated from backend HMAC when enabled
    apiKey: '', // Disqus public API key if configured
    sso: {
      name: currentUser?.name ? `${currentUser.name} (${currentUser.department})` : 'Claim Master Staff',
      button: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '',
      icon: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '',
      url: typeof window !== 'undefined' ? window.location.origin : '',
      logout: typeof window !== 'undefined' ? window.location.origin : '',
      profile_url: typeof window !== 'undefined' ? `${window.location.origin}/profile/{username}` : '',
      width: '800',
      height: '400',
    },
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
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Posting As:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <span>{currentUser.avatar}</span>
                <span>{currentUser.name} ({currentUser.department})</span>
              </span>
            </div>
          )}
        </div>

        {/* Informational Callout */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <span>
            Disqus discussions are powered by the <strong>claim-master</strong> community channel. Sign in with your Disqus or social account, or guest comment if enabled.
          </span>
        </div>
      </div>

      {/* Disqus Discussion Embed Container */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm overflow-hidden min-h-[400px]">
        <DiscussionEmbed
          shortname={disqusShortname}
          config={disqusConfig}
        />
      </div>
    </div>
  );
}
