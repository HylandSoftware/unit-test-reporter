export enum AnnotationLevel {
  Notice = 'notice',
  Warning = 'warning',
  Failure = 'failure',
}

export class Annotation {
  constructor(
    readonly path: string,
    readonly start_line: number,
    readonly end_line: number,
    readonly start_column: number,
    readonly end_column: number,
    readonly annotation_level: AnnotationLevel,
    readonly title: string,
    readonly message: string,
    readonly raw_details: string
  ) {}
}
