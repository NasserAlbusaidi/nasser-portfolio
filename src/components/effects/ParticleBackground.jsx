import React, { useCallback } from 'react';
import Particles from '@tsparticles/react';
import { loadFull } from 'tsparticles'; // or `loadSlim` if you want a smaller bundle

const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    // console.log("Particles container loaded", container);
  }, []);

  const options = {
    background: {
      color: {
        value: "transparent", // Background color of the canvas
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: {
          enable: false, // Disable click interaction
          mode: "push",
        },
        onHover: {
          enable: true,
          mode: "repulse", // Particles move away from mouse on hover
        },
        resize: true,
      },
      modes: {
        push: {
          quantity: 4,
        },
        repulse: {
          distance: 100,
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: "#ffffff", // Color of the particles
      },
      links: {
        color: "#ffffff",
        distance: 150,
        enable: false, // Disable lines between particles
        opacity: 0.4,
        width: 1,
      },
      collisions: {
        enable: false,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: {
          default: "bounce",
        },
        random: false,
        speed: 0.3, // Slower movement
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 80, // Number of particles
      },
      opacity: {
        value: 0.5,
      },
      shape: {
        type: "circle", // Shape of particles
      },
      size: {
        value: { min: 1, max: 2 }, // Size range of particles
      },
    },
    detectRetina: true,
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={options}
      className="fixed inset-0 z-0" // Position behind everything
    />
  );
};

export default ParticleBackground;
