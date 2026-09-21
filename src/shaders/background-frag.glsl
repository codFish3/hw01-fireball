#version 300 es
precision highp float;

uniform vec2 u_Resolution;
uniform float u_Time;

in vec2 fs_UV;

out vec4 out_Col;

float hash21(vec2 p) {
    return fract(
        sin(dot(p, vec2(127.1, 311.7))) * 43758.5453
    );
}

float starField(vec2 pixelPosition) {
    float cellSize = 70.0;

    vec2 gridPosition = pixelPosition / cellSize;
    vec2 cell = floor(gridPosition);
    vec2 local = fract(gridPosition);

    float exists = step(0.5, hash21(cell));

    vec2 center = vec2(
        hash21(cell + vec2(13.7, 7.1)),
        hash21(cell + vec2(5.3, 19.9))
    );

    center = mix(vec2(0.15), vec2(0.85), center);

    float distancePixels = length(
        (local - center) * cellSize
    );

    float radius = mix(
        1.6, 2.6,
        hash21(cell + vec2(31.4, 11.2))
    );

    float core = 1.0 - smoothstep(
        radius * 0.3, radius, distancePixels
    );

    float halo = exp(
        -distancePixels * distancePixels / 8.0
    );

    float brightness = mix(
        0.6, 1.0,
        hash21(cell + vec2(41.2, 27.8))
    );

    // star twinkle
    float speed = mix(
        0.8, 2.0,
        hash21(cell + vec2(63.1, 17.5))
    );
    float phase = 6.2831853 * hash21(cell + vec2(23.8, 52.6));
    float twinkle = 0.6 + 0.4 * sin(u_Time * speed + phase);

    return exists * brightness * twinkle * (core + 0.2 * halo);
}

void main() {
    vec3 bottomColor = vec3(0.16, 0.055, 0.07);
    vec3 topColor = vec3(0.035, 0.055, 0.14);

    vec3 color = mix(
        bottomColor,
        topColor,
        smoothstep(0.0, 1.0, fs_UV.y)
    );

    vec2 p = (gl_FragCoord.xy - 0.5 * u_Resolution)
           / u_Resolution.y;

    // glow
    float radiusSquared = dot(p, p);

    float outerGlow = exp(-radiusSquared * 5.0);
    float innerGlow = exp(-radiusSquared * 14.0);

    color += vec3(0.22, 0.055, 0.012) * outerGlow;
    color += vec3(0.20, 0.085, 0.020) * innerGlow;

    float glow = outerGlow;

    // star field
    float stars = starField(gl_FragCoord.xy);

    // gradient fade
    stars *= 1.0 - 0.5 * glow;

    color += vec3(0.75, 0.85, 1.0) * stars;

    out_Col = vec4(clamp(color, 0.0, 1.0), 1.0);
}