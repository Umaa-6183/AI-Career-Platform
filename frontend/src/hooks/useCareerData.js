/**
 * CareerIQ Pro — Custom React Hooks
 * Data fetching, state management, and career intelligence hooks
 */

import { useState, useEffect, useCallback, useRef } from "react";
import api from "../api";

// ── Generic fetch hook ────────────────────────────────────────────────────────

export function useFetch(fetchFn, deps = [], immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(...args);
      if (mounted.current) setData(result);
      return result;
    } catch (err) {
      if (mounted.current) setError(err.message || "Request failed");
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, deps); // eslint-disable-line

  useEffect(() => {
    if (immediate) execute();
    return () => { mounted.current = false; };
  }, [execute]); // eslint-disable-line

  return { data, loading, error, refetch: execute };
}


// ── Market Insights ───────────────────────────────────────────────────────────

export function useMarketInsights() {
  return useFetch(api.market.insights, [], true);
}


// ── Salary Levels ─────────────────────────────────────────────────────────────

export function useSalaryLevels() {
  const [levels, setLevels] = useState(null);

  useEffect(() => {
    api.salary.levels().then(d => {
      if (d?.status === "success") setLevels(d.levels);
    }).catch(() => {});
  }, []);

  return levels;
}


// ── Job Matching ─────────────────────────────────────────────────────────────

export function useJobMatching(user) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchJobs = useCallback(async () => {
    if (!user?.skills?.length) return;
    setLoading(true);
    const salaryScore = (user.current_salary || 0) / 500_000;
    const result = await api.jobs.match({
      user_skills: user.skills,
      experience_years: user.experience_years || 0,
      current_salary_score: salaryScore,
      target_roles: user.target_role ? [user.target_role] : [],
    });
    if (result?.jobs) {
      setJobs(result.jobs);
      setLastFetched(new Date());
    }
    setLoading(false);
  }, [user?.skills, user?.experience_years, user?.current_salary]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, lastFetched, refetch: fetchJobs };
}


// ── Skill Gap ─────────────────────────────────────────────────────────────────

export function useSkillGap(currentSkills, targetRole) {
  const [gap, setGap] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentSkills?.length || !targetRole) return;
    setLoading(true);
    api.skills.gap(currentSkills, targetRole).then(d => {
      if (d?.status === "success") setGap(d.gap_analysis);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [currentSkills?.join(","), targetRole]); // eslint-disable-line

  return { gap, loading };
}


// ── Resume Analysis ───────────────────────────────────────────────────────────

export function useResumeAnalyzer() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (resumeText, targetRole) => {
    if (!resumeText?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.resume.analyze(resumeText, targetRole);
      if (data?.status === "success") {
        setResult(data);
      }
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, analyze, reset: () => setResult(null) };
}


// ── Score History ─────────────────────────────────────────────────────────────

export function useScoreHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.progress.scores().then(d => {
      if (d?.history) setHistory(d.history);
    }).catch(() => {});
  }, []);

  return history;
}


// ── Salary Normalization ──────────────────────────────────────────────────────

export function useSalaryNorm(salary) {
  const levels = [
    { level: "L1", range: [30000,50000] }, { level: "L2", range: [50000,70000] },
    { level: "L3", range: [70000,90000] }, { level: "L4", range: [90000,120000] },
    { level: "L5", range: [120000,160000] }, { level: "L6", range: [160000,200000] },
    { level: "L7", range: [200000,260000] }, { level: "L8", range: [260000,340000] },
    { level: "L9", range: [340000,450000] }, { level: "L10", range: [450000,1000000] },
  ];
  for (let i = 0; i < levels.length; i++) {
    const { level, range } = levels[i];
    if (salary >= range[0] && salary < range[1]) {
      const score = (i + (salary - range[0]) / (range[1] - range[0])) / 10;
      return { level, score: parseFloat(score.toFixed(3)), percentile: Math.round(score * 100) };
    }
  }
  return { level: "L10", score: 1.0, percentile: 99 };
}


// ── Debounce ──────────────────────────────────────────────────────────────────

export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}


// ── Local storage sync ────────────────────────────────────────────────────────

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });

  const setStoredValue = useCallback((newValue) => {
    setValue(newValue);
    try { localStorage.setItem(key, JSON.stringify(newValue)); } catch {}
  }, [key]);

  return [value, setStoredValue];
}


// ── Window size ───────────────────────────────────────────────────────────────

export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
}
