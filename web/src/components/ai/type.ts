type Prompt = {
    id: string;
    intent: string;
    category: string;
    is_discoverable: boolean;
    allow_explicit_trigger: boolean;
    description?: string;
    template: string;
}