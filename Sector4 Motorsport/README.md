# Sector4 Motorsport - Official Website Package (v4)

## What's New in this Build:
1. **Pure Green & Pure Red Curves**: Telemetry throttle curve updated to pure electric green (`#00FF66`) and brake curve updated to pure racing red (`#FF2233`), removing the prior lime/orange tones.
2. **Requested 4-Phase Telemetry Sequence**:
   - **Phase 1**: Acceleration smoothly climbs to 25%, then drops back down.
   - **Phase 2**: Throttle drops, brake spikes up to 100% (Threshold Braking).
   - **Phase 3**: Trail brake smoothly decays down through the corner apex.
   - **Phase 4**: Full acceleration ramps up to 100%.
3. **Motion Blur Scan Bar**: The moving vertical needle now renders a multi-layer trailing ghost-blur effect with gradient decay as it scans to the right.
4. **GT3 Engine RPM Audio Synthesizer**: Added real-time Web Audio API harmonic engine sound that dynamically revs up with throttle/RPM, barks on downshifts, and screams up to the redline limiter as the animation completes.
5. **Fixed Dock Navigation & Woosh FX**: All icon buttons in the right dock smoothly navigate to their respective sections with a high-speed air/cloth swipe sound effect and row flash highlighting.

## Files:
- `index.html`: Main HTML file with telemetry preloader & dock buttons
- `style.css`: Minimalist brutalist dark theme, enclosed fuel boxes, and motion blur keyframes
- `app.js`: Engine RPM audio synthesizer, telemetry preloader engine, and fuel strategy calculator
- `logo.png`: Official Sector4 Motorsport logo
- `glyph_click.wav`: Standalone Nothing OS click sample

## Free Hosting:
1. Extract the folder and drag & drop to https://app.netlify.com/drop
2. Or push to GitHub Pages under Settings > Pages.
