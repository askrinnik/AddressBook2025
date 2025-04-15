using AddressBook.Contracts.Models;
using MediatR;

namespace AddressBook.Contracts;

public record DeleteContactByIdQuery(int Id) : IRequest<DeleteContactByIdResponse>;