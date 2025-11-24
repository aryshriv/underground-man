"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import "./Dostoevsky.css";
//import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
// import * as dat from "dat.gui";

export default function Dostoevsky() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pointerLocked, setPointerLocked] = useState(false);

  let meches: any[] = [];

  // CHECKPOINT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  // Initialize scene, camera, and renderer
  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Create a pivot group for the camera
    const cameraHolder = new THREE.Group();
    cameraHolder.add(camera);
    scene.add(cameraHolder);

    // Position the camera and holder
    camera.position.set(0, 7, 0); // Camera sits at the center of the holder
    cameraHolder.position.set(17, 0, -13); // Holder is slightly above the ground

    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Small box size
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red box
    const cameraBox = new THREE.Mesh(boxGeometry, boxMaterial);

    // Position the box at the "feet" of the cameraHolder
    cameraBox.position.set(0, 0, 0); // Below the camera, relative to the cameraHolder
    cameraBox.visible = false; // Hide the box
    cameraHolder.add(cameraBox); // Attach to the cameraHolder

    const windBox = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Small box size
    const windMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red box
    const windMesh = new THREE.Mesh(windBox, windMaterial);
    // Position the box at the "feet" of the cameraHolder
    windMesh.position.set(5.3, 7.5, -15); // Below the camera, relative to the cameraHolder
    //cameraBox.visible = false; // Hide the box
    //scene.add(windMesh); // Attach to the cameraHolder

    // Load and set up the audio
    const listener = new THREE.AudioListener(); // Create an audio listener
    camera.add(listener); // Attach listener to the camera

    const tracks: any[] = [];
    const audioLoader = new THREE.AudioLoader(); // Audio loader

    const audioFiles = [
      "./resources/footstep1.mp3",
      "./resources/footstep2.mp3",
      "./resources/footstep3.mp3",
      "./resources/footstep4.mp3",
      "./resources/footstep5.mp3",
      "./resources/footstep6.mp3",
      "./resources/footstep7.mp3",
      "./resources/footstep8.mp3",
    ];

    audioFiles.forEach((file) => {
      const sound = new THREE.PositionalAudio(listener);
      audioLoader.load(file, (buffer) => {
        sound.setBuffer(buffer); // Set the audio buffer
        sound.setLoop(false); // No looping
        sound.setVolume(0.75); // Adjust volume as needed
      });
      tracks.push(sound); // Add the sound to the tracks array
      cameraBox.add(sound); // Attach the sound to the cameraBox
    });

    audioLoader.load("./resources/wind.mp3", (buffer) => {
      const sound = new THREE.Audio(listener);
      sound.setBuffer(buffer); // Set the audio buffer
      sound.setLoop(true); // Loop the audio
      sound.setVolume(0.02); // Adjust volume as needed
      //windMesh.add(sound); // Attach the sound to the cameraBox
      sound.play(); // Start playing the audio
    });

    // Load the GLTF model
    const loader = new GLTFLoader();
    let interactableObjects: any[] = []; // Array to hold objects we want to hover over

    loader.load(
      "https://stava.io/resources/underground-man-apartment6.glb",
      function (gltf: GLTF) {
        setIsLoaded(true);
        gltf.scene.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            console.log(node.name, node.material, node.geometry);
            if (node.isMesh) {
              meches.push(node);
            }

            if (node.name === "Window_2" || node.name === "Window002_1") {
              // Check if the material is an array or a single material
              if (Array.isArray(node.material)) {
                // If it's an array, apply changes to each material
                node.material.forEach((material) => {
                  if (material instanceof THREE.Material) {
                    material.opacity = 0.5;
                    material.transparent = true;
                  }
                });
              } else {
                // Single material case
                node.material.opacity = 0.5;
                node.material.transparent = true;
              }

              node.castShadow = false;
              node.receiveShadow = false;
            } else if (
              node.name === "Model_material0_0002" ||
              node.name === "Model_material0_0001" ||
              node.name === "Model_material0_0" ||
              node.name === "Plane005"
            ) {
              node.castShadow = false;
              node.receiveShadow = false;
            } else {
              node.castShadow = true;
              node.receiveShadow = true;
            }

            // Add to interactable objects
            interactableObjects.push(node);

            // // Create a Points object to render vertices
            // const pointsMaterial = new THREE.PointsMaterial({
            //   color: 0xff0000, // Bright red color
            //   size: 0.05, // Adjust point size as needed
            // });

            // const points = new THREE.Points(node.geometry, pointsMaterial);
            // points.position.copy(node.position);
            // points.rotation.copy(node.rotation);
            // points.scale.copy(node.scale);
            // // add a small coordinate label to each vertex with text sprite

            // // If the node has a parent, add points to the parent to maintain correct positioning
            // if (node.parent) {
            //   node.parent.add(points);
            // } else {
            //   scene.add(points);
            // }
          }
        });

        gltf.scene.scale.set(3, 3, 3);
        gltf.scene.position.set(0, 0, 0);

        scene.add(gltf.scene);
      },
      function (xhr) {
        const progress = Math.round((xhr.loaded / xhr.total) * 100);
        setProgress(progress);
      },
      function (error: any) {
        console.error("An error occurred while loading the model:", error);
      }
    );

    // Add a directional light to simulate the sun
    const sunLight = new THREE.DirectionalLight(0x506886, 10.0);
    sunLight.position.set(0, 30, -40);
    sunLight.target.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.bias = -0.001;
    sunLight.shadow.mapSize.width = 2048 * 2;
    sunLight.shadow.mapSize.height = 2048 * 2;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 500.0;
    sunLight.shadow.camera.left = 100;
    sunLight.shadow.camera.right = -100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // Add a raycaster for detecting clicked objects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Add event listener for mouse clicks
    window.addEventListener("click", (event) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Set up the raycaster using the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Check for intersections with interactable objects
      const intersects = raycaster.intersectObjects(interactableObjects);

      if (intersects.length > 0) {
        // Get the first intersected object
        const clickedObject = intersects[0].object;

        // Log the name and material of the clicked object
        console.log("Clicked object:", clickedObject.name);
      }
    });

    const ambientLight = new THREE.AmbientLight(0x506886, 2);
    scene.add(ambientLight);

    let candleLight = new THREE.PointLight(0xffaa33, 10, 5, 1);
    candleLight.position.set(-8.5, 9, 1);
    candleLight.castShadow = false;
    scene.add(candleLight);

    var candleLight2 = new THREE.PointLight(0xffaa33, 10, 10, 1);
    candleLight2.position.set(-8.5, 10, 1);
    candleLight2.castShadow = false;
    scene.add(candleLight2);

    var candleLight3 = new THREE.PointLight(0xffaa33, 10, 5, 1);
    candleLight3.position.set(-1.5, 6, 4);
    candleLight3.castShadow = false;
    scene.add(candleLight3);

    var candleLight3a = new THREE.PointLight(0xffaa33, 10, 10, 1);
    candleLight3a.position.set(-1.5, 7, 4);
    candleLight3a.castShadow = false;
    scene.add(candleLight3a);

    var candleLight4 = new THREE.PointLight(0xffaa33, 10, 5, 1);
    candleLight4.position.set(18.6, 8, -12.5);
    candleLight4.castShadow = false;
    scene.add(candleLight3);

    var candleLight4a = new THREE.PointLight(0xffaa33, 10, 10, 1);
    candleLight4a.position.set(18.6, 9, -12.5);
    candleLight4a.castShadow = false;
    scene.add(candleLight4a);
    var candleLight5a = new THREE.PointLight(0xffaa33, 10, 10, 1);
    candleLight5a.position.set(18.6, 9, 13);
    candleLight5a.castShadow = false;
    scene.add(candleLight5a);

    var candleLight6 = new THREE.PointLight(0xffaa33, 3, 2, 1);
    candleLight6.position.set(12, 2, 0.75);
    candleLight6.castShadow = false;
    scene.add(candleLight6);

    // make a rectarealight
    const rectLight = new THREE.RectAreaLight(0xffaa33, 10, 3, 3);
    rectLight.position.set(10.25, 2, 1);
    rectLight.lookAt(4, 0, 1);
    scene.add(rectLight);

    // Load skybox textures
    // const loader1 = new THREE.CubeTextureLoader();
    // const texture = loader1.load([
    //   "./resources/black.jpg",
    //   "./resources/black.jpg",
    //   "./resources/skyz1.jpg",
    //   "./resources/black.jpg",
    //   "./resources/black.jpg",
    //   "./resources/skyz2.jpg",
    // ]);
    //scene.background = texture;
    scene.background = new THREE.Color(0x070d16);

    const geometry1 = new THREE.BufferGeometry();
    const vertices1 = [];

    for (let i = 0; i < 1000; i++) {
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      vertices1.push(x, y, z);
    }
    geometry1.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices1, 3)
    );
    const material = new THREE.PointsMaterial({ color: 0xffffff });
    const starField = new THREE.Points(geometry1, material);
    scene.add(starField);

    // First-person navigation variables
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;

    // Pointer lock setup
    const canvas = renderer.domElement;

    canvas.addEventListener("click", () => {
      canvas.requestPointerLock();
    });

    document.addEventListener("pointerlockchange", () => {
      if (document.pointerLockElement === canvas) {
        console.log("Pointer locked");
        setPointerLocked(true);
        document.addEventListener("mousemove", onMouseMove, false);
      } else {
        console.log("Pointer unlocked");
        document.removeEventListener("mousemove", onMouseMove, false);
      }
    });

    // Variables for camera rotation
    let pitch = 0; // Vertical rotation
    let yaw = 0; // Horizontal rotation

    // Handle mouse movement for first-person look
    function onMouseMove(event: MouseEvent) {
      const deltaX = event.movementX || 0;
      const deltaY = event.movementY || 0;

      // Update yaw and pitch
      yaw -= deltaX * 0.002;
      pitch -= deltaY * 0.002;

      // Constrain pitch to avoid flipping the camera
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

      // Apply rotations
      cameraHolder.rotation.y = yaw; // Rotate horizontally
      camera.rotation.x = pitch; // Rotate vertically (local rotation for the camera)
    }

    // Add event listeners for keyboard input
    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "KeyW":
          moveForward = true;
          break;
        case "KeyS":
          moveBackward = true;
          break;
        case "KeyA":
          moveLeft = true;
          break;
        case "KeyD":
          moveRight = true;
          break;
        case "ShiftLeft":
          walkSpeed = 0.08;
          break;
        case "Space": // Space for jump
          if (
            (!isJumping && cameraHolder.position.y > groundLevel - 0.1) ||
            cameraHolder.position.y < groundLevel + 0.2
          ) {
            isJumping = true; // Start jump
            yVelocity = jumpStrength; // Set upward velocity
          }
          break;
      }
    });

    document.addEventListener("keyup", (event) => {
      switch (event.code) {
        case "KeyW":
          moveForward = false;
          break;
        case "KeyS":
          moveBackward = false;
          break;
        case "KeyA":
          moveLeft = false;
          break;
        case "KeyD":
          moveRight = false;
          break;
        case "ShiftLeft":
          walkSpeed = 0.04;
          break;
        case "Space":
          walkSpeed = 0.04;
          break;
      }
    });

    // Prevent falling by keeping the cameraHolder above a certain y-coordinate
    let groundLevel = 0;
    let walkTime = 0; // Tracks time for wobble effect
    let currentVelocity = new THREE.Vector3(); // Smooth velocity for movement
    const accelerationFactor = 0.1; // Controls how quickly movement starts

    let isWalking = false; // Track if the player is currently walking
    let targetY = groundLevel;
    let walkSpeed = 0.04;

    let isJumping = false; // Track if the player is jumping
    let yVelocity = 0; // Vertical velocity
    const jumpStrength = 0.3; // Jump strength (initial upward velocity)
    const gravity = -0.01; // Gravity strength

    const restrictedAreas: THREE.Box3[] = [
      new THREE.Box3(
        new THREE.Vector3(13.75, 0, -14), // Min corner
        new THREE.Vector3(15.5, 15, 4.5) // Max corner
      ),
      new THREE.Box3(
        new THREE.Vector3(13.75, 9, 2),
        new THREE.Vector3(15.5, 15, 8.5)
      ),
      new THREE.Box3(
        new THREE.Vector3(13.75, 0, 8),
        new THREE.Vector3(15.5, 15, 14.5)
      ),
      new THREE.Box3(
        new THREE.Vector3(-15.5, 0, 0),
        new THREE.Vector3(-13.75, 15, 15)
      ),

      new THREE.Box3(
        new THREE.Vector3(-3, 0, -16.5),
        new THREE.Vector3(14.5, 15, -15.5)
      ),
      new THREE.Box3(
        new THREE.Vector3(-3, 0, -16.5),
        new THREE.Vector3(14.5, 3, -13.75)
      ),
      //window
      new THREE.Box3(
        new THREE.Vector3(-3, 3, -16.5),
        new THREE.Vector3(2.75, 15, -13.75)
      ),
      new THREE.Box3(
        new THREE.Vector3(8, 3, -16.5),
        new THREE.Vector3(14.5, 15, -13.75)
      ),
      new THREE.Box3(
        new THREE.Vector3(1.75, 12, -16.5),
        new THREE.Vector3(9, 15, -13.75)
      ),
      new THREE.Box3(
        new THREE.Vector3(14.5, 0, -15.5),
        new THREE.Vector3(24, 15, -13.75)
      ),
      // corridor
      new THREE.Box3(
        new THREE.Vector3(22.5, 0, -14),
        new THREE.Vector3(24, 15, 15.5)
      ),
      // bathroom
      new THREE.Box3(
        new THREE.Vector3(-14, 0, 13.75),
        new THREE.Vector3(24, 15, 15.5)
      ),
      new THREE.Box3(
        new THREE.Vector3(-14, 0, -1),
        new THREE.Vector3(-2.75, 15, 0.5)
      ),
      new THREE.Box3(
        new THREE.Vector3(-3.75, 0, -16.5),
        new THREE.Vector3(-2.25, 15, 9)
      ),
      // overhead walkway
      new THREE.Box3(
        new THREE.Vector3(-3.75, 9, 8),
        new THREE.Vector3(-2.25, 15, 14.5)
      ),
      // tub
      new THREE.Box3(
        new THREE.Vector3(-14.5, 0, 0),
        new THREE.Vector3(-3, 4, 1.75)
      ),
      new THREE.Box3(
        new THREE.Vector3(-14.5, 0, 0),
        new THREE.Vector3(-12, 4, 9)
      ),
      new THREE.Box3(
        new THREE.Vector3(-14.5, 0, 4.5),
        new THREE.Vector3(-3, 4, 5.5)
      ),
      new THREE.Box3(
        new THREE.Vector3(-6, 0, 0),
        new THREE.Vector3(-3, 4, 5.5)
      ),
      // door
      new THREE.Box3(
        new THREE.Vector3(13.25, 0, 7.5),
        new THREE.Vector3(14.25, 9, 8.5)
      ),
      // chair
      new THREE.Box3(
        new THREE.Vector3(10.5, 0, 10.5),
        new THREE.Vector3(13.75, 2.5, 13.75)
      ),
      // table
      new THREE.Box3(
        new THREE.Vector3(2.5, 0, 11),
        new THREE.Vector3(9, 4, 14.25)
      ),
      // kamin
      new THREE.Box3(
        new THREE.Vector3(10, 0, -1),
        new THREE.Vector3(13.25, 3, 2.25)
      ),
      // bed
      new THREE.Box3(
        new THREE.Vector3(7.5, 0, -14.25),
        new THREE.Vector3(14.25, 3, -1.5)
      ),
      // bookshelf
      new THREE.Box3(
        new THREE.Vector3(-2.75, 0, -14.25),
        new THREE.Vector3(-0.5, 11, -9.5)
      ),
      // undershelf table
      new THREE.Box3(
        new THREE.Vector3(-2.75, 0, -9),
        new THREE.Vector3(0.7, 4, -2.5)
      ),
      // hanging shelf
      new THREE.Box3(
        new THREE.Vector3(-2.75, 6, -9),
        new THREE.Vector3(-0.7, 10.5, -2.5)
      ),
      // desk table
      new THREE.Box3(
        new THREE.Vector3(-2.75, 0, -1.75),
        new THREE.Vector3(1.75, 5, 4.5)
      ),
      // desk chair
      new THREE.Box3(
        new THREE.Vector3(1.25, 0, -0.5),
        new THREE.Vector3(3.75, 3, 2)
      ),
      new THREE.Box3(
        new THREE.Vector3(2.75, 2.5, -0.5),
        new THREE.Vector3(3.75, 5, 0)
      ),
      new THREE.Box3(
        new THREE.Vector3(3.25, 2.5, -0.5),
        new THREE.Vector3(3.75, 5, 1)
      ),
      // samovar
      new THREE.Box3(
        new THREE.Vector3(-2.75, 0, 5.5),
        new THREE.Vector3(0.5, 7, 8)
      ),
      // toilet
      new THREE.Box3(
        new THREE.Vector3(-12, 0, 9.25),
        new THREE.Vector3(-9.5, 2.5, 14.25)
      ),
      new THREE.Box3(
        new THREE.Vector3(-12, 2, 12.25),
        new THREE.Vector3(-9.5, 6, 14.25)
      ),
      // ceiling
      new THREE.Box3(
        new THREE.Vector3(-14.25, 15, -16), // Min corner
        new THREE.Vector3(23, 15.5, 14.25) // Max corner
      ),
    ];

    for (let i = 1; i < 23; i++) {
      restrictedAreas.push(
        new THREE.Box3(
          new THREE.Vector3(14 - i / 8, 0, 7.75 - i / 8),
          new THREE.Vector3(14.5 - i / 8, 9, 8.5 - i / 8)
        )
      );
    }

    // visualize restricted areas
    restrictedAreas.forEach((box) => {
      const geometry = new THREE.BoxGeometry(
        box.max.x - box.min.x,
        box.max.y - box.min.y,
        box.max.z - box.min.z
      );
      const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (box.min.x + box.max.x) / 2,
        (box.min.y + box.max.y) / 2,
        (box.min.z + box.max.z) / 2
      );
      //scene.add(mesh);
    });

    let bufferLength = 0.3;

    let underBox = false;

    function checkBounds() {
      let highestGroundLevel = -Infinity;
      restrictedAreas.forEach((box) => {
        // Calculate overlaps for each axis
        const overlapXMin = cameraHolder.position.x - box.min.x;
        const overlapXMax = box.max.x - cameraHolder.position.x;
        const overlapZMin = cameraHolder.position.z - box.min.z;
        const overlapZMax = box.max.z - cameraHolder.position.z;

        // Handle X-axis restriction
        if (
          cameraHolder.position.x > box.min.x &&
          cameraHolder.position.x < box.min.x + bufferLength &&
          cameraHolder.position.z > box.min.z &&
          cameraHolder.position.z < box.max.z &&
          cameraHolder.position.y < box.max.y &&
          cameraHolder.position.y + 7 > box.min.y &&
          overlapXMin < overlapZMin &&
          overlapXMin < overlapZMax
        ) {
          cameraHolder.position.x = box.min.x;
          currentVelocity.x = 0;
        } else if (
          cameraHolder.position.x < box.max.x &&
          cameraHolder.position.x > box.max.x - bufferLength &&
          cameraHolder.position.z > box.min.z &&
          cameraHolder.position.z < box.max.z &&
          cameraHolder.position.y < box.max.y &&
          cameraHolder.position.y + 7 > box.min.y &&
          overlapXMax < overlapZMin &&
          overlapXMax < overlapZMax
        ) {
          cameraHolder.position.x = box.max.x;
          currentVelocity.x = 0;
        }

        // Handle Z-axis restriction
        if (
          cameraHolder.position.z > box.min.z &&
          cameraHolder.position.z < box.min.z + bufferLength &&
          cameraHolder.position.x > box.min.x &&
          cameraHolder.position.x < box.max.x &&
          cameraHolder.position.y < box.max.y &&
          cameraHolder.position.y + 7 > box.min.y &&
          overlapZMin < overlapXMin &&
          overlapZMin < overlapXMax
        ) {
          cameraHolder.position.z = box.min.z;
          currentVelocity.z = 0;
        } else if (
          cameraHolder.position.z < box.max.z &&
          cameraHolder.position.z > box.max.z - bufferLength &&
          cameraHolder.position.x > box.min.x &&
          cameraHolder.position.x < box.max.x &&
          cameraHolder.position.y < box.max.y &&
          cameraHolder.position.y + 7 > box.min.y &&
          overlapZMax < overlapXMin &&
          overlapZMax < overlapXMax
        ) {
          cameraHolder.position.z = box.max.z;
          currentVelocity.z = 0;
        }

        // Handle Y-axis restriction (standing on the box)
        if (
          cameraHolder.position.y > box.max.y - bufferLength &&
          cameraHolder.position.y < box.max.y + bufferLength &&
          cameraHolder.position.x > box.min.x &&
          cameraHolder.position.x < box.max.x &&
          cameraHolder.position.z > box.min.z &&
          cameraHolder.position.z < box.max.z
        ) {
          //cameraHolder.position.y = box.min.y;
          highestGroundLevel = Math.max(highestGroundLevel, box.max.y);
        } else if (
          cameraHolder.position.y < box.min.y + bufferLength &&
          cameraHolder.position.y + 7 > box.min.y - bufferLength &&
          cameraHolder.position.x < box.max.x &&
          cameraHolder.position.x > box.min.x &&
          cameraHolder.position.z < box.max.z &&
          cameraHolder.position.z > box.min.z
        ) {
          // prevent the jump from going through the ceiling
          underBox = true;
          //currentVelocity.y = -jumpStrength;
          console.log("under box");
        } else {
          //isJumping = true;
          groundLevel = 0;
        }
        groundLevel = highestGroundLevel > -Infinity ? highestGroundLevel : 0;

        // Handle Y-axis restriction (hitting the box from below)
      });
    }
    let footUp = false;

    function animate() {
      requestAnimationFrame(animate);
      checkBounds();

      if (cameraHolder.position.y > 0.25) {
        // Pick a random track
        footUp = true;
        console.log(footUp);
      }

      if (footUp && cameraHolder.position.y < 0) {
        console.log(footUp);
        footUp = false;
        const inner = Math.random() * tracks.length;
        console.log("inner:", inner);
        const randomIndex = Math.floor(inner);
        const randomTrack = tracks[randomIndex];
        console.log("Playing track:", randomIndex);

        // Play the selected track
        randomTrack.play();
      }

      // Calculate movement direction based on cameraHolder orientation
      const targetVelocity = new THREE.Vector3();
      if (moveForward || moveBackward || moveLeft || moveRight) {
        if (moveForward) {
          const forward = new THREE.Vector3(0, 0, -1);
          forward.applyQuaternion(cameraHolder.quaternion);
          targetVelocity.add(forward);
        }
        if (moveBackward) {
          const backward = new THREE.Vector3(0, 0, 1);
          backward.applyQuaternion(cameraHolder.quaternion);
          targetVelocity.add(backward);
        }
        if (moveLeft) {
          const left = new THREE.Vector3(-1, 0, 0);
          left.applyQuaternion(cameraHolder.quaternion);
          targetVelocity.add(left);
        }
        if (moveRight) {
          const right = new THREE.Vector3(1, 0, 0);
          right.applyQuaternion(cameraHolder.quaternion);
          targetVelocity.add(right);
        }
        targetVelocity.normalize();
      }

      currentVelocity.lerp(
        targetVelocity.multiplyScalar(walkSpeed),
        accelerationFactor
      );

      // Apply buffer zone restriction logic
      cameraHolder.position.add(currentVelocity);

      // Restrict position if colliding with boxes

      if (isJumping) {
        yVelocity += gravity; // Apply gravity
        console.log(underBox);
        if (!underBox) {
          cameraHolder.position.y += yVelocity; // Update y-position
        } else {
          // abort jump and set the player on the ground naturally
          isJumping = false;
          underBox = false;
          yVelocity = 0.3;
          console.log("abort jump");
        }

        if (cameraHolder.position.y <= groundLevel) {
          cameraHolder.position.y = groundLevel; // Reset to ground level
          yVelocity = 0; // Reset velocity
          isJumping = false; // End jump
          walkSpeed = 0.04; // Reset walk speed to default after landing
        }
      }

      // Prevent the cameraHolder from falling below ground level
      cameraHolder.position.y = Math.max(cameraHolder.position.y, groundLevel);

      // Apply wobble effect
      if (currentVelocity.length() > 0.01) {
        // Only wobble when moving
        walkTime += currentVelocity.length() * 0.5;
        cameraHolder.position.y += Math.sin(walkTime * 2 * 1.5) * 0.02; // Vertical bobbing (wider and slower)
        targetY = groundLevel + Math.sin(walkTime * 2 * 1.5) * 0.02;
        if (cameraHolder.position.y > groundLevel && !isJumping) {
          cameraHolder.position.y = THREE.MathUtils.lerp(
            cameraHolder.position.y,
            groundLevel + Math.sin(walkTime * 2 * 1.5) * 0.02,
            0.06
          );
        }
      } else if (!isWalking && currentVelocity.length() <= 0.1 && !isJumping) {
        // Stop on a bob trough (downstride)
        targetY = groundLevel;
        const bobOffset = Math.sin(walkTime * 2 * 1.5) * 0.02; // Calculate current bob offset
        if (bobOffset > 0) {
          // Wait until bob reaches the trough
          walkTime += 0.05; // Progress the bob animation to move toward the trough
        } else {
          // Align with ground level and reset walkTime
          cameraHolder.position.y = THREE.MathUtils.lerp(
            cameraHolder.position.y,
            targetY,
            0.1
          );
        }
      }

      // Update camera rendering
      renderer.render(scene, camera);

      const coordinatesDiv = document.getElementById("coordinates");
      const position = cameraHolder.position; // Use `cameraHolder.position` if using the pivot group setup
      if (coordinatesDiv) {
        coordinatesDiv.textContent = `(${position.x.toFixed(
          2
        )}, ${position.y.toFixed(2)}, ${position.z.toFixed(
          2
        )}), groundLevel: ${groundLevel.toFixed(
          2
        )}, walkTime: ${walkTime.toFixed(2)}`;
      }
    }

    animate();

    // Handle window resizing
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return () => {
      window.removeEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
      renderer.dispose();

      // Ensure renderer DOM element is only removed if it is still a child
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {!pointerLocked && isLoaded && (
          <div className="flex flex-col bg-black/90 absolute top-0 bottom-0 left-0 right-0 items-center justify-center pointer-events-none z-100">
            <div
              className="font-bold text-2xl"
              style={{ fontFamily: "Girassol" }}
            >
              WASD keys to move, mouse to look around.
            </div>
            <div
              className="font-bold text-2xl mt-8"
              style={{ fontFamily: "Girassol" }}
            >
              Use headphones if possible.
            </div>
            <div className=" mt-8 text-4xl" style={{ fontFamily: "Girassol" }}>
              Click screen to begin.
            </div>
          </div>
        )}
        {!isLoaded && (
          <div className="flex flex-col absolute top-0 bottom-0 left-0 right-0 items-center justify-center pointer-events-none z-100">
            <div
              className="font-bold text-4xl"
              style={{ fontFamily: "Girassol" }}
            >
              THE UNDERGROUND MAN's Apartment
            </div>
            <div className="mt-4 text-lg" style={{ fontFamily: "Girassol" }}>
              by Aryaman Shrivastava
            </div>
            <div
              className="text-orange-600 mt-8 text-lg"
              style={{ fontFamily: "Girassol" }}
            >{`Loading ${progress}%`}</div>
          </div>
        )}
        <div
          ref={mountRef}
          style={{ width: "100%", height: "100%", overflow: "hidden" }}
        />
      </div>
    </>
  );
}
