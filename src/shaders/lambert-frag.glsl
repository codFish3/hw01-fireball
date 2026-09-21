#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform float u_Time;
uniform vec4 u_Color; // The color with which to render this instance of geometry.

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them

in float fs_Displacement;
in float fs_Detail;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

float pulse(float c, float w, float x) {
    float distanceToCenter = abs(x - c);
    float t = clamp(distanceToCenter / w, 0.0, 1.0);
    return 1.0 - t * t * (3.0 - 2.0 * t);
}

void main()
{
    float heat = 0.5 + 1.0 * fs_Displacement + 0.65 * fs_Detail;

    // fragment shader
    // pulse
    heat += 0.04 * sin(u_Time * 1.5 + fs_Detail * 6.0);
    heat = clamp(heat, 0.0, 1.0);

    vec3 darkRed    = vec3(0.18, 0.005, 0.002);
    vec3 orange    = vec3(1.00, 0.16, 0.015);
    vec3 yellow    = vec3(1.00, 0.65, 0.06);
    vec3 paleYellow = vec3(1.00, 0.95, 0.65);

    // smoothstep
    vec3 color = mix(
        darkRed, orange,
        smoothstep(0.15, 0.50, heat)
    );

    color = mix(
        color, yellow,
        smoothstep(0.45, 0.75, heat)
    );

    color = mix(
        color, paleYellow,
        smoothstep(0.72, 0.95, heat)
    );

    // move light band
    float bandCenter = 0.65 + 0.08 * sin(u_Time * 0.8);
    float band = pulse(bandCenter, 0.12, heat);
    color += band * vec3(0.08, 0.04, 0.01);

    out_Col = vec4(clamp(color, 0.0, 1.0), 1.0);
}
