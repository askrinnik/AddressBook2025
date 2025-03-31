using AddressBook.Contracts.Models;
using MediatR;

namespace AddressBook.Contracts;

public record GetContactByIdQuery(int Id) : IRequest<ContactModel?>;