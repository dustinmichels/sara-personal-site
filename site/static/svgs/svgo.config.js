module.exports = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Set precision to 5 to preserve high-fidelity curves and path details
          convertPathData: {
            floatPrecision: 5,
            transformPrecision: 5,
          },
          cleanupNumericValues: {
            floatPrecision: 5,
          },
          convertTransform: {
            floatPrecision: 5,
            transformPrecision: 5,
          },
        },
      },
    },
  ],
};
