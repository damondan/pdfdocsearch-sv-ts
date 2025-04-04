<script lang="ts">
    import { onMount } from "svelte";
    import mermaid from "mermaid";

    export let definition: string = "";

    export let type: "default" | "component" | "sequence" | "entity" | "default";

    export let config: Record<string, any> = {};

    let elementId: string = `mermaid-${Math.floor(Math.random() * 100000)}`;
    let containerDiv: HTMLDivElement | null = null;
    let isRendered: boolean = false;

    onMount(async () => {
        try {
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
                    if (type === "entity") {
                        svgElement.style.width = "20%";
                        svgElement.style.maxWidth = "700px";
                    } else if (type === "sequence") {
                        svgElement.style.width = "90%";
                        svgElement.style.maxWidth = "800px";
                    } else {
                        svgElement.style.width = "100%";
                        svgElement.style.maxWidth = "900px";
                    }

                    svgElement.style.height = "auto";
                    svgElement.style.margin = "0 auto";
                    svgElement.style.display = "block";
                }
            }
        } catch (error) {
            console.error("Mermaid rendering error:", error);
        }
    });
</script>

<div class="mermaid-container" class:entity-container={type === "entity"}>
    {#if !isRendered}
        <div class="loading">Loading diagram...</div>
    {/if}
    <div bind:this={containerDiv} class="mermaid-output"></div>
</div>

<style>
    .mermaid-container {
        width: 100%;
        display: flex;
        justify-content: center;
        position: relative;
        min-height: 100px;
    }

    .loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-style: italic;
        color: #666;
    }

    .mermaid-output {
        width: 100%;
        display: flex;
        justify-content: center;
    }
</style>
