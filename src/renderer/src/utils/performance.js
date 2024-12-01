// src/utils/performance.js
export const PerformanceMonitor = {
    startTime: null,
    measurements: {},
  
    start(label) {
      if (!this.measurements[label]) {
        this.measurements[label] = {
          count: 0,
          totalTime: 0,
          min: Infinity,
          max: -Infinity
        };
      }
      this.startTime = performance.now();
    },
  
    end(label) {
      if (this.startTime === null) return;
      
      const duration = performance.now() - this.startTime;
      const measurement = this.measurements[label];
      
      measurement.count++;
      measurement.totalTime += duration;
      measurement.min = Math.min(measurement.min, duration);
      measurement.max = Math.max(measurement.max, duration);
      
      this.startTime = null;
  
      console.log(`Performance [${label}]:`, {
        duration: `${duration.toFixed(2)}ms`,
        average: `${(measurement.totalTime / measurement.count).toFixed(2)}ms`,
        min: `${measurement.min.toFixed(2)}ms`,
        max: `${measurement.max.toFixed(2)}ms`,
        count: measurement.count
      });
    }
  };