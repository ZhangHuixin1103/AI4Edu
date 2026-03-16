'use client';

import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';

const mistakeItems = [
  {
    icon: '🍊',
    text: 'Orange juice mix problem',
    prompt: "Today we're going to explore some recipes for making orange juice. Let's look at these mixes: Mix A has 2 cups concentrate and 3 cups water, Mix B has 1 cup concentrate and 4 cups water, Mix C has 4 cups concentrate and 8 cups water, and Mix D has 3 cups concentrate and 5 cups water. Which do you think will be the most \"orangey\"?",
  },
  {
    icon: '🍫',
    text: 'Chocolate sharing problem',
    prompt: "Let's look at the Chocolate Problem. A chocolate bar is divided into 4 equal pieces. Lena eats 3 pieces. How much of the whole chocolate bar did Lena eat?",
  },
  {
    icon: '🚗',
    text: 'Driving distance problem',
    prompt: "Let's look at a problem about driving distances. Emma's family drives at a constant speed. After 3 hours, they've traveled 15 miles, and after 6 hours, they've traveled 30 miles. How far will they travel in 9 hours?",
  },
];

interface GreetingProps {
  chatId: string;
  append: UseChatHelpers['append'];
}

export const Greeting = ({ chatId, append }: GreetingProps) => {
  const handleMistakeClick = async (prompt: string) => {
    window.history.replaceState({}, '', `/chat/${chatId}`);
    await append({ role: 'user', content: prompt });
  };

  return (
    <div
      key="overview"
      className="max-w-2xl mx-auto md:mt-16 px-6 size-full flex flex-col justify-center gap-6"
    >
      {/* Header label */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2"
      >
        <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1">
          Teacher Training Platform
        </span>
      </motion.div>

      {/* Main card: student persona */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="relative bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex gap-4 items-start"
      >
        {/* Avatar */}
        <div className="shrink-0 size-14 rounded-full bg-amber-100 dark:bg-amber-900 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center text-3xl select-none">
          🙋
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-amber-900 dark:text-amber-200 text-base">Alex</span>
            <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full px-2 py-0.5 font-medium">Middle Schooler</span>
            <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full px-2 py-0.5 font-medium">Struggling with Math</span>
          </div>
          {/* Speech bubble */}
          <div className="bg-white dark:bg-zinc-800 border border-amber-200 dark:border-amber-700 rounded-xl rounded-tl-none px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Hi teacher! I&apos;m Alex, a 7th grader. We just started learning about ratios and proportions in math class — I already know how to do basic multiplication and division, and I think I understand what a ratio is!
          </div>
        </div>
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed"
      >
        You are talking with{' '}
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">Alex, a middle school student</span>.
        He keeps making some kinds of mistakes on math problems.{' '}
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">Can you figure out what he&apos;s getting wrong and help him understand?</span>
      </motion.p>

      {/* Mistake tags — clickable */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-2"
      >
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Click a problem to see how Alex solves it
        </p>
        <div className="flex flex-wrap gap-2">
          {mistakeItems.map((item, i) => (
            <motion.button
              key={item.text}
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + i * 0.08 }}
              onClick={() => handleMistakeClick(item.prompt)}
              className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-full px-3 py-1.5 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-800 dark:hover:bg-amber-900/40 dark:hover:border-amber-700 dark:hover:text-amber-300 cursor-pointer transition-colors"
            >
              <span>{item.icon}</span>
              {item.text}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* CTA hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
        className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"
      >
        <span className="inline-block size-1.5 rounded-full bg-green-400 animate-pulse" />
        Try giving Alex a new problem, or ask him to explain his thinking
      </motion.p>
    </div>
  );
};
