class Entity {
    constructor(props={}) {
        this.id = null;
        this.renderPriority = props.renderPriority || 0;
        this.origin = props.origin;
        this.enabled = props.enabled || true;
    }
    setup(){}
    render(deltaTime){}
    update(deltaTime){}
    enable(){
        this.enabled = true;
    }
    disable(){
        this.enabled = false;
    }
    remove(){
        if (this.engine !== null) {
            this.engine.removeEntity(this);
        }
        this.engine = null;
    }
}