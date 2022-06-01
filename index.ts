import * as React from "react";

export enum RemixPerfMark {
  SubmissionNavigationStart = "💿:submission-navigation-start",
  SubmissionNavigationEnd = "💿:submission-navigation-end",
  LoadingNavigationStart = "💿:loading-navigation-start",
  LoadingNavigationEnd = "💿:loading-navigation-end",
  SubmittingStart = "💿:submitting-start",
  SubmittingEnd = "💿:submitting-end",
  LoadingStart = "💿:loading-start",
  LoadingEnd = "💿:loading-end",
}

export enum RemixPerfMeasure {
  SubmissionNavigation = "💿:submission-navigation",
  Submitting = "💿:submitting",
  Loading = "💿:loading",
  LoadingNavigation = "💿:loading-navigation",
}

let navId = 0;

function findRight(
  arr: PerformanceMark[],
  predicate: (m: PerformanceMark) => boolean
): PerformanceMark | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      return arr[i];
    }
  }
}

function getLastMark(): PerformanceMark | undefined {
  let marks = window.performance.getEntriesByType("mark") as PerformanceMark[];
  return findRight(marks, (m) => m.detail.id === navId);
}

function wasSubmissionNavigation() {
  let marks = window.performance.getEntriesByType("mark") as PerformanceMark[];
  return findRight(
    marks,
    (m) =>
      m.detail.id === navId &&
      m.name === RemixPerfMark.SubmissionNavigationStart
  );
}

interface Navigation {
  state: "idle" | "submitting" | "loading";
}

export function useSpaMetrics(navigation: Navigation) {
  React.useEffect(() => {
    if (navigation.state === "idle") {
      if (!getLastMark()) {
        return;
      }

      if (wasSubmissionNavigation()) {
        // Complete submission navigation
        window.performance.mark(RemixPerfMark.LoadingEnd, {
          detail: { id: navId },
        });
        window.performance.mark(RemixPerfMark.SubmissionNavigationEnd, {
          detail: { id: navId },
        });
        window.performance.measure(
          RemixPerfMeasure.SubmissionNavigation,
          RemixPerfMark.SubmissionNavigationStart,
          RemixPerfMark.SubmissionNavigationEnd
        );
        window.performance.measure(
          RemixPerfMeasure.Loading,
          RemixPerfMark.LoadingStart,
          RemixPerfMark.LoadingEnd
        );
      } else {
        // Complete normal navigation
        window.performance.mark(RemixPerfMark.LoadingEnd, {
          detail: { id: navId },
        });
        window.performance.mark(RemixPerfMark.LoadingNavigationEnd, {
          detail: { id: navId },
        });
        window.performance.measure(
          RemixPerfMeasure.LoadingNavigation,
          RemixPerfMark.LoadingNavigationStart,
          RemixPerfMark.LoadingNavigationEnd
        );
        window.performance.measure(
          RemixPerfMeasure.Loading,
          RemixPerfMark.LoadingStart,
          RemixPerfMark.LoadingEnd
        );
      }
    } else if (navigation.state === "submitting") {
      // Start submission navigation
      navId++;
      window.performance.mark(RemixPerfMark.SubmissionNavigationStart, {
        detail: { id: navId },
      });
      window.performance.mark(RemixPerfMark.SubmittingStart, {
        detail: { id: navId },
      });
    } else if (navigation.state === "loading") {
      if (!getLastMark()) {
        // Start normal navigation if no marks exist for the current navId
        navId++;
        window.performance.mark(RemixPerfMark.LoadingNavigationStart, {
          detail: { id: navId },
        });
        window.performance.mark(RemixPerfMark.LoadingStart, {
          detail: { id: navId },
        });
      } else {
        // Finish submitting state and start loading state for the current
        // submission navigation
        window.performance.mark(RemixPerfMark.SubmittingEnd, {
          detail: { id: navId },
        });
        window.performance.measure(
          RemixPerfMeasure.Submitting,
          RemixPerfMark.SubmittingStart,
          RemixPerfMark.SubmittingEnd
        );
        window.performance.mark(RemixPerfMark.LoadingStart, {
          detail: { id: navId },
        });
      }
    }
  }, [navigation.state]);
}
