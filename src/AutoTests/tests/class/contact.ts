export class Contact {
  id: number;
  firstName: string;
  lastName: string;
  birthday?: string;

  constructor(firstName: string, lastName: string, birthday?: string) {
    this.id = 0;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthday = birthday;
  }

  static createCorrectContactWithBirthday(): Contact {
    return new Contact('Petr', 'Petrov', '2011-11-11');
  }
  static createCorrectContactWithoutBirthday(): Contact {
    return new Contact('Petr', 'Petrov');
  }
  static createIncorrectContact(): Contact {
    return new Contact('1234567890123456789012345678901', '1234567890123456789012345678901');
  }
}
