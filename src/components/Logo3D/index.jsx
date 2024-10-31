"use client";
import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useTheme } from "next-themes";

const LogoText = () => {
  const textRef = useRef();
  const materialRef = useRef();
  const { theme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(theme === "dark");

  useEffect(() => {
    setIsDarkMode(theme === "dark");
  }, [theme]);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta * 0.5;
    }
  });

  return (
    <Text
      ref={textRef}
      fontSize={3}
      depth={0.8}
      bevelEnabled
      bevelThickness={0.3}
      bevelSize={0.15}
      anchorX="center"
      anchorY="middle"
    >
      LawHub
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          time: { value: 0 },
          color1: {
            value: new THREE.Color(isDarkMode ? "#777" : "#eee"),
          },
          color2: {
            value: new THREE.Color(isDarkMode ? "#bbb" : "#aaa"),
          },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform vec3 color1;
          uniform vec3 color2;
          varying vec2 vUv;
          void main() {
            float stripe = sin(vUv.x * 10.0 + time * 2.0);
            vec3 color = mix(color1, color2, stripe * 0.5 + 0.5);
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </Text>
  );
};

const Scene = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{
        width: "100%",
        backgroundColor: "var(--gray-2)",
      }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <spotLight
        position={[-5, 5, 5]}
        intensity={1}
        angle={0.3}
        penumbra={0.5}
      />

      <LogoText />
    </Canvas>
  );
};

export default Scene;
