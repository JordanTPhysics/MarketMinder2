



export class Review {
  PlaceName: string;
  Name: string;
  Rating: number;
  Text: string;
  PublishTime: Date;

  constructor(
    PlaceName: string,
    Name: string,
    Rating: number,
    Text: string,
    PublishTime: Date,
  ) {
    this.PlaceName = PlaceName;
    this.Name = Name;
    this.Rating = Rating;
    this.Text = Text;
    this.PublishTime = PublishTime;
  }
}