import { SlashProvider } from "@milkdown/kit/plugin/slash";

export function slashPluginView(view: any) {
    const content = document.createElement("div");

    const provider = new SlashProvider({
        content,
    });

    return {
        update: (updatedView: any, prevState: any) => {
            provider.update(updatedView, prevState);
        },
        destroy: () => {
            provider.destroy();
            content.remove();
        },
    };
}