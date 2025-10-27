import * as B from '@babylonjs/core';
// import "@babylonjs/loaders";

class InputsManager {
    
    private isInitialized = false;

    public scene? : B.Scene;

    private keyState: Map<string, {down:boolean, up:boolean, pressed:boolean}> = new Map();

    private keys = new Map<string, boolean | number>([
        ['space', false]
    ]);

    public Initialize(scene : B.Scene) : void{

        if (this.isInitialized)
            return;

        this.scene = scene;

        scene.onKeyboardObservable.add((kbInfo) => {

            const state = this.keyState.get(kbInfo.event.code) || { down: false, up: false, pressed: false };

            switch (kbInfo.type) {

                case B.KeyboardEventTypes.KEYDOWN:
                    if (!state.pressed) {
                        state.down = true; // Só no frame em que pressionou
                    }
                    state.pressed = true; // Mantém pressionado
                    break;

                case B.KeyboardEventTypes.KEYUP:
                    state.up = true; // Só no frame em que soltou
                    state.pressed = false;
                    break;
            }

            this.keyState.set(kbInfo.event.code, state);

        });


        this.scene.registerBeforeRender(() => {

            this.Update();

        })

        this.isInitialized = true;

    }

    public ResetInputs() {
        for (const state of Array.from(this.keyState.values())) {
            state.down = false;
            state.up = false;
        }
        
        // for (const [key, state] of this.keyState.entries()) {
        //     state.down = false;
        //     state.up = false;
        // }
    }

    public Update():void {

        this.keys.set('space', this.keyState.get("Space")?.down || false);
        
        this.ResetInputs();
    }





    public get Space(): boolean | number {
        if (!this.isInitialized) {
            throw new Error("InputsManager não foi inicializado. Chame initialize() primeiro.");
        }
        return this.keys.get('space')!;
    }

}

export const InputsInstance = new InputsManager();