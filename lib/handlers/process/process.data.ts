export abstract class ProcessData {
    public id!: string;

    public hasEnded: boolean = false;

    public associations: string[] = [];

    associateWith(id: string): void {
        const indexOf = this.associations.indexOf(id);

        if (indexOf === -1) {
            this.associations.push(id);
        }
    }

    removeAssociation(id: string): void {
        const indexOf = this.associations.indexOf(id);

        if (indexOf !== -1) {
            this.associations.splice(indexOf, 1);
        }
    }

    end(): void {
        this.hasEnded = true;
    }
}
