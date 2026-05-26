import React from 'react';
import { HiOutlineChatBubbleLeftRight, HiOutlineUserCircle, HiOutlineCpuChip } from 'react-icons/hi2';

const TranscriptViewer = ({ transcript = '' }) => {
  // Parse lines: e.g. "System: Hello, this is... \n Customer: No, I haven't... \n"
  const parseTranscript = () => {
    if (!transcript.trim()) return [];

    return transcript
      .split('\n')
      .filter((line) => line.trim())
      .map((line, idx) => {
        const isSystem = line.startsWith('System:');
        const isCustomer = line.startsWith('Customer:');
        
        let speaker = 'System';
        let content = line;

        if (isSystem) {
          speaker = 'System';
          content = line.replace('System:', '').trim();
        } else if (isCustomer) {
          speaker = 'Customer';
          content = line.replace('Customer:', '').trim();
        } else {
          // Unlabeled fallbacks
          speaker = idx % 2 === 0 ? 'System' : 'Customer';
          content = line;
        }

        return {
          id: idx,
          speaker,
          content,
        };
      });
  };

  const parsedLines = parseTranscript();

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] h-full flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-brand-textPrimary tracking-tight flex items-center gap-2 mb-4">
          <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-brand-primary" />
          IVR Call Transcript
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[380px] space-y-4 pr-1 min-h-[160px] flex flex-col">
        {parsedLines.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-brand-textSecondary">
            No dialogue transcript recorded for this session.
          </div>
        ) : (
          parsedLines.map((line) => {
            const isSys = line.speaker === 'System';

            return (
              <div
                key={line.id}
                className={`flex gap-3 max-w-[85%] ${
                  isSys ? 'self-start' : 'self-end flex-row-reverse'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSys
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'bg-white/[0.03] text-brand-textSecondary border border-white/[0.08]'
                  }`}
                >
                  {isSys ? (
                    <HiOutlineCpuChip className="w-4 h-4" />
                  ) : (
                    <HiOutlineUserCircle className="w-4.5 h-4.5" />
                  )}
                </div>

                {/* Speech Bubble */}
                <div
                  className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                    isSys
                      ? 'bg-white/[0.02] border border-white/[0.06] text-brand-textPrimary rounded-tl-none'
                      : 'bg-brand-primary text-white rounded-tr-none shadow-md shadow-brand-primary/10'
                  }`}
                >
                  <p className="font-bold text-[10px] text-brand-textSecondary uppercase tracking-wider mb-1">
                    {line.speaker}
                  </p>
                  <p>{line.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TranscriptViewer;
