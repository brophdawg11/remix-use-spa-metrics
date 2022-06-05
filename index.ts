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

interface Predicate {
  (m: PerformanceMark): boolean;
}

let navId = 0;

function findRight(
  arr: PerformanceMark[],
  predicate: Predicate
): PerformanceMark | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      return arr[i];
    }
  }
}

function getLastNavEntry(
  type: "mark" | "measure",
  predicate?: Predicate
): PerformanceMark | undefined {
  let marks = window.performance.getEntriesByType(type) as PerformanceMark[];
  return findRight(
    marks,
    (m) => m.detail?.id === navId && (!predicate || predicate(m))
  );
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

function mark(name: string, detail?: Record<string, unknown>) {
  // console.debug(navId, "performance.mark()", name, detail);
  return window.performance.mark(name, {
    detail: {
      ...detail,
      id: navId,
    },
  });
}

function measure(name: string, start: string, end: string) {
  // console.debug(navId, "performance.measure()", name, start, end);
  return window.performance.measure(name, {
    start,
    end,
    detail: {
      id: navId,
    },
  });
}

function completeNavigation(
  type: "submitting" | "loading",
  callback: CallbackFunction
) {
  let startMark = getLastNavEntry("mark", (m) => m.detail.fromLocation != null);

  let submissionMeasure =
    type === "submitting"
      ? getLastNavEntry(
          "measure",
          (m) => m.name === RemixPerfMeasure.Submitting
        )
      : null;

  let loadingMeasure = getLastNavEntry(
    "measure",
    (m) => m.name === RemixPerfMeasure.Loading
  );

  let navMeasure = getLastNavEntry(
    "measure",
    (m) =>
      m.name ===
      (type === "submitting"
        ? RemixPerfMeasure.SubmissionNavigation
        : RemixPerfMeasure.LoadingNavigation)
  );

  if (!startMark || !navMeasure || !loadingMeasure) {
    console.error(
      "Could not find proper nav marks/measures, skipping SPA metrics"
    );
    return;
  }

  callback({
    type,
    fromLocation: startMark.detail.fromLocation,
    toLocation: startMark.detail.toLocation,
    finalLocation: location,
    submissionDuration: submissionMeasure?.duration,
    loadingDuration: loadingMeasure.duration,
    totalDuration: navMeasure.duration,
  });
}

interface Navigation {
  state: "idle" | "submitting" | "loading";
  location: {
    pathname: string;
    search: string;
  };
}

export interface CallbackData {
  type: "submitting" | "loading";
  fromLocation: Location;
  toLocation: Location;
  finalLocation: Location;
  submissionDuration?: number;
  loadingDuration: number;
  totalDuration: number;
}

export interface CallbackFunction {
  (data: CallbackData): void;
}

export function useSpaMetrics(
  location: Location,
  navigation: Navigation,
  callback: CallbackFunction
) {
  React.useEffect(() => {
    if (navigation.state === "idle") {
      if (!getLastNavEntry("mark")) {
        return;
      }

      if (wasSubmissionNavigation()) {
        // Complete submission navigation
        mark(RemixPerfMark.LoadingEnd);
        mark(RemixPerfMark.SubmissionNavigationEnd);
        measure(
          RemixPerfMeasure.SubmissionNavigation,
          RemixPerfMark.SubmissionNavigationStart,
          RemixPerfMark.SubmissionNavigationEnd
        );
        measure(
          RemixPerfMeasure.Loading,
          RemixPerfMark.LoadingStart,
          RemixPerfMark.LoadingEnd
        );
        completeNavigation("submitting", callback);
      } else {
        // Complete normal navigation
        mark(RemixPerfMark.LoadingEnd);
        mark(RemixPerfMark.LoadingNavigationEnd);
        measure(
          RemixPerfMeasure.LoadingNavigation,
          RemixPerfMark.LoadingNavigationStart,
          RemixPerfMark.LoadingNavigationEnd
        );
        measure(
          RemixPerfMeasure.Loading,
          RemixPerfMark.LoadingStart,
          RemixPerfMark.LoadingEnd
        );
        completeNavigation("loading", callback);
      }

      // Prep next navigation
      navId++;
    } else if (navigation.state === "submitting") {
      // Start submission navigation
      mark(RemixPerfMark.SubmissionNavigationStart, {
        fromLocation: location,
        toLocation: navigation.location,
      });
      mark(RemixPerfMark.SubmittingStart, {
        detail: { id: navId },
      });
    } else if (navigation.state === "loading") {
      if (!getLastNavEntry("mark")) {
        // Start normal navigation if no marks exist for the current navId
        mark(RemixPerfMark.LoadingNavigationStart, {
          fromLocation: location,
          toLocation: navigation.location,
        });
        mark(RemixPerfMark.LoadingStart);
      } else {
        // Finish submitting state and start loading state for the current
        // submission navigation
        mark(RemixPerfMark.SubmittingEnd);
        measure(
          RemixPerfMeasure.Submitting,
          RemixPerfMark.SubmittingStart,
          RemixPerfMark.SubmittingEnd
        );
        mark(RemixPerfMark.LoadingStart);
      }
    }
  }, [navigation.state]);
}
