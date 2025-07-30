<script lang="ts">
    import { onMount } from "svelte";
    import mermaid from "mermaid";

    export let definition: string = "";
    export let type: "default" | "component" | "sequence" | "entity" = "default";
    export let config: Record<string, any> = {};

    let elementId: string = `mermaid-${Math.floor(Math.random() * 100000)}`;
    let containerDiv: HTMLDivElement | null = null;
    let panZoomContainer: HTMLDivElement | null = null;
    let isRendered: boolean = false;

    // Pan and zoom state
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    onMount(async () => {
        try {
            // Render the Mermaid diagram
            mermaid.initialize({
                startOnLoad: false,
                theme: "default",
                securityLevel: "loose",
                ...config,
            });

            const { svg } = await mermaid.render(elementId, definition);

            if (containerDiv) {
                containerDiv.innerHTML = svg;
                isRendered = true;

                const svgElement = containerDiv.querySelector("svg");
                if (svgElement) {
                    // Let SVG use its natural size
                    svgElement.style.width = "auto";
                    svgElement.style.height = "auto";
                    svgElement.style.maxWidth = "none";
                    svgElement.style.display = "block";
                    svgElement.style.margin = "0";

                    // Get natural dimensions and adjust container
                    const bbox = svgElement.getBBox();
                    const naturalWidth = bbox.width;
                    const naturalHeight = bbox.height;

                    if (panZoomContainer) {
                        // Set container size to accommodate the diagram
                        const containerHeight = Math.max(naturalHeight + 100, 400);
                        panZoomContainer.style.height = `${Math.min(containerHeight, 800)}px`;
                        
                        // Center the diagram initially
                        const containerRect = panZoomContainer.getBoundingClientRect();
                        translateX = (containerRect.width - naturalWidth) / 2;
                        translateY = (containerRect.height - naturalHeight) / 2;
                        updateTransform();
                    }
                }
            }
        } catch (error) {
            console.error("Mermaid rendering error:", error);
            isRendered = true;
        }
    });

    // Transform functions
    function updateTransform() {
        if (containerDiv) {
            containerDiv.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            containerDiv.style.transformOrigin = "top left";
        }
    }

    function zoomIn() {
        scale = Math.min(scale * 1.2, 5);
        updateTransform();
    }

    function zoomOut() {
        scale = Math.max(scale / 1.2, 0.2);
        updateTransform();
    }

    function resetZoom() {
        scale = 1;
        if (panZoomContainer && containerDiv) {
            const svgElement = containerDiv.querySelector("svg");
            if (svgElement) {
                const bbox = svgElement.getBBox();
                const containerRect = panZoomContainer.getBoundingClientRect();
                translateX = (containerRect.width - bbox.width) / 2;
                translateY = (containerRect.height - bbox.height) / 2;
            }
        }
        updateTransform();
    }

    function fitToWindow() {
        if (panZoomContainer && containerDiv) {
            const svgElement = containerDiv.querySelector("svg");
            if (svgElement) {
                const bbox = svgElement.getBBox();
                const containerRect = panZoomContainer.getBoundingClientRect();
                
                const scaleX = (containerRect.width - 40) / bbox.width;
                const scaleY = (containerRect.height - 40) / bbox.height;
                scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
                
                translateX = (containerRect.width - bbox.width * scale) / 2;
                translateY = (containerRect.height - bbox.height * scale) / 2;
                updateTransform();
            }
        }
    }

    // Mouse events for panning
    function handleMouseDown(event: MouseEvent) {
        isDragging = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        if (panZoomContainer) {
            panZoomContainer.style.cursor = "grabbing";
        }
    }

    function handleMouseMove(event: MouseEvent) {
        if (isDragging) {
            const deltaX = event.clientX - lastMouseX;
            const deltaY = event.clientY - lastMouseY;
            
            translateX += deltaX;
            translateY += deltaY;
            
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
            
            updateTransform();
        }
    }

    function handleMouseUp() {
        isDragging = false;
        if (panZoomContainer) {
            panZoomContainer.style.cursor = "grab";
        }
    }

    function handleWheel(event: WheelEvent) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(Math.min(scale * delta, 5), 0.2);
        
        // Zoom towards mouse position
        const rect = panZoomContainer?.getBoundingClientRect();
        if (rect) {
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            translateX = mouseX - (mouseX - translateX) * (newScale / scale);
            translateY = mouseY - (mouseY - translateY) * (newScale / scale);
        }
        
        scale = newScale;
        updateTransform();
    }

    function handleDoubleClick(event: MouseEvent) {
        const rect = panZoomContainer?.getBoundingClientRect();
        if (rect) {
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            const newScale = Math.min(scale * 1.5, 5);
            translateX = mouseX - (mouseX - translateX) * (newScale / scale);
            translateY = mouseY - (mouseY - translateY) * (newScale / scale);
            scale = newScale;
            updateTransform();
        }
    }
</script>

<div class="mermaid-container" class:entity-container={type === "entity"}>
    <div 
        bind:this={panZoomContainer}
        class="pan-zoom-wrapper"
        on:mousedown={handleMouseDown}
        on:mousemove={handleMouseMove}
        on:mouseup={handleMouseUp}
        on:mouseleave={handleMouseUp}
        on:wheel={handleWheel}
        on:dblclick={handleDoubleClick}
        role="img"
        tabindex="0"
    >
        <!-- Control Panel -->
        <div class="control-panel">
            <button on:click={zoomIn} class="control-btn">
                Zoom In
            </button>
            <button on:click={zoomOut} class="control-btn">
                Zoom Out
            </button>
            <button on:click={resetZoom} class="control-btn">
                Reset
            </button>
            <button on:click={fitToWindow} class="control-btn">
                Fit
            </button>
        </div>

        <!-- Help Text -->
        <div class="help-text">
            Double-click to zoom • Mouse wheel to zoom • Click & drag to pan
        </div>

        <!-- Mermaid Content -->
        <div class="mermaid-content">
            {#if !isRendered}
                <div class="loading">Loading diagram...</div>
            {/if}
            <div bind:this={containerDiv} class="mermaid-output"></div>
        </div>
    </div>
</div>

<style>
    .mermaid-container {
        width: 100%;
        display: flex;
        justify-content: center;
        position: relative;
        min-height: 400px;
        margin-bottom: 20px;
    }

    .pan-zoom-wrapper {
        width: 100%;
        min-height: 400px;
        max-height: 800px;
        border: 2px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
        position: relative;
        overflow: hidden;
        cursor: grab;
        user-select: none;
    }

    .pan-zoom-wrapper:focus {
        outline: 2px solid #007bff;
        outline-offset: 2px;
    }

    .control-panel {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
        display: flex;
        gap: 5px;
        background-color: rgba(255, 255, 255, 0.95);
        padding: 8px;
        border-radius: 6px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .control-btn {
        padding: 6px 12px;
        font-size: 13px;
        font-weight: 500;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: white;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .control-btn:hover {
        background-color: #f0f0f0;
        border-color: #999;
        transform: translateY(-1px);
    }

    .control-btn:active {
        transform: translateY(0);
    }

    .help-text {
        position: absolute;
        bottom: 10px;
        left: 10px;
        z-index: 1000;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 6px 12px;
        font-size: 11px;
        border-radius: 4px;
        font-weight: 500;
    }

    .mermaid-content {
        width: 100%;
        height: 100%;
        position: relative;
        padding: 20px;
    }

    .loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-style: italic;
        color: #666;
        z-index: 100;
        font-size: 16px;
    }

    .mermaid-output {
        position: relative;
        transition: transform 0.1s ease-out;
    }
</style>