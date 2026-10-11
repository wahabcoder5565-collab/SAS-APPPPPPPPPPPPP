"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface FacilityNode {
  id: string;
  name: string;
  tag: string;
  type: "combustion" | "cooling" | "flare" | "monitoring" | "sop" | "alarm";
  color: number;
  position: [number, number, number];
}

const NODES: FacilityNode[] = [
  { id: "b07", name: "Boiler B-07", tag: "250 MMBtu/hr", type: "combustion", color: 0xb91c1c, position: [-8, 3.5, 2] },
  { id: "ct4", name: "Cooling Tower CT-4", tag: "45,000 gpm", type: "cooling", color: 0xd97706, position: [8, 2.5, -2] },
  { id: "f101", name: "Flare F-101", tag: "Elevated Header", type: "flare", color: 0x2563eb, position: [-6, -4, 3] },
  { id: "cems", name: "CEMS Analyzer", tag: "NOx / O2 Span", type: "monitoring", color: 0x059669, position: [7, -3.5, 1] },
  { id: "sop44", name: "SOP-44 Procedure", tag: "Firing Limits", type: "sop", color: 0x475569, position: [-2, 5.5, -3] },
  { id: "dcs", name: "DCS Alarm Setpoint", tag: "0.075 Warning", type: "alarm", color: 0xc2410c, position: [3, -5, -2] },
];

export default function ThreeFacilityScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1, 26);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lights - refined architectural lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x1e3a8a, 2.2);
    dirLight1.position.set(12, 16, 14);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0284c7, 1.2);
    dirLight2.position.set(-12, -8, 10);
    scene.add(dirLight2);

    // 5. Central Hub (Permit Core T-V-2024)
    const hubGroup = new THREE.Group();

    // Core icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(2.2, 2);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x1d4ed8,
      emissive: 0x172554,
      emissiveIntensity: 0.5,
      shininess: 90,
      transparent: true,
      opacity: 0.92,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    hubGroup.add(coreMesh);

    // Outer wireframe cage
    const wireGeo = new THREE.IcosahedronGeometry(2.85, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    hubGroup.add(wireMesh);
    scene.add(hubGroup);

    // 6. Orbital Rings
    const rings: THREE.Line[] = [];
    const ringRadii = [7.5, 11, 14.5];
    ringRadii.forEach((radius, idx) => {
      const ringGeo = new THREE.BufferGeometry();
      const segments = 64;
      const positions = new Float32Array((segments + 1) * 3);
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        positions[i * 3] = Math.cos(theta) * radius;
        positions[i * 3 + 1] = Math.sin(theta) * radius;
        positions[i * 3 + 2] = 0;
      }
      ringGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const ringMat = new THREE.LineBasicMaterial({
        color: idx === 0 ? 0x1e40af : idx === 1 ? 0x0284c7 : 0x64748b,
        transparent: true,
        opacity: 0.22 - idx * 0.05,
      });
      const ringLine = new THREE.Line(ringGeo, ringMat);
      ringLine.rotation.x = Math.PI / 3 + idx * 0.25;
      ringLine.rotation.y = idx * 0.35;
      scene.add(ringLine);
      rings.push(ringLine);
    });

    // 7. Satellite Facility Nodes
    const nodeMeshes: THREE.Group[] = [];
    NODES.forEach((n) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(...n.position);

      // Sphere
      const sphereGeo = new THREE.SphereGeometry(0.82, 24, 24);
      const sphereMat = new THREE.MeshPhongMaterial({
        color: n.color,
        emissive: n.color,
        emissiveIntensity: 0.25,
        shininess: 70,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      nodeGroup.add(sphere);

      // Outer ring halo
      const haloGeo = new THREE.RingGeometry(1.05, 1.25, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: n.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      nodeGroup.add(halo);

      scene.add(nodeGroup);
      nodeMeshes.push(nodeGroup);
    });

    // 8. Dynamic Connecting Lines
    const linesGroup = new THREE.Group();
    NODES.forEach((n) => {
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...n.position)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x2563eb,
        transparent: true,
        opacity: 0.3,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      linesGroup.add(line);
    });
    scene.add(linesGroup);

    // 9. Ambient Particle Cloud
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 36;
      particlePositions[i + 1] = (Math.random() - 0.5) * 22;
      particlePositions[i + 2] = (Math.random() - 0.5) * 16;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x1e3a8a,
      size: 0.1,
      transparent: true,
      opacity: 0.3,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 10. Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseX = (x / rect.width) * 2;
      mouseY = -(y / rect.height) * 2;
    };

    window.addEventListener("mousemove", onMouseMove);

    // 11. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      targetX += (mouseX * 3.2 - targetX) * 0.04;
      targetY += (mouseY * 2.2 - targetY) * 0.04;
      camera.position.x = targetX;
      camera.position.y = 1 + targetY;
      camera.lookAt(0, 0, 0);

      // Rotate central hub
      hubGroup.rotation.y = elapsedTime * 0.16;
      hubGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.1;

      // Rotate rings
      rings.forEach((ring, idx) => {
        ring.rotation.z = elapsedTime * (0.07 + idx * 0.025);
      });

      // Animate satellite nodes gently
      nodeMeshes.forEach((mesh, idx) => {
        mesh.position.y = NODES[idx].position[1] + Math.sin(elapsedTime * 1.4 + idx) * 0.22;
        mesh.rotation.y = elapsedTime * 0.35;
      });

      // Drift particles
      particles.rotation.y = elapsedTime * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Resize Handler
    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[360px] sm:min-h-[420px] flex items-center justify-center transition-opacity duration-500 cursor-grab active:cursor-grabbing"
      style={{ opacity: mounted ? 1 : 0 }}
      aria-label="Interactive 3D Facility Topology Scene"
    />
  );
}
