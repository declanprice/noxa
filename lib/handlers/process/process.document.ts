import { DocumentField } from '../../store';

export abstract class ProcessDocument {
  @DocumentField()
  private processEnded: boolean = false;

  @DocumentField()
  private associations: string[] = [];

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
    this.processEnded = true;
  }
}
