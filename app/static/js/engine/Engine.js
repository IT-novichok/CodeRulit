let LENGHT = 0;
class Engine{
    constructor(props={}) {
        this.canvas = props.canvas;
        this.entities = props.entities || {};
        this.renderer = Renderer(this);
    }
    startRender(){
        Renderer().start()
        Renderer().finish()
    }
    generateUniqueId(seed = 1) {
    }
    update(){
        for (const entity of this.entities){
            entity.update();
        }
    }
}