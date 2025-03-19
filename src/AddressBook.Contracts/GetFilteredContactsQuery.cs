using AddressBook.Contracts.Models;
using MediatR;

namespace AddressBook.Contracts;

public record GetFilteredContactsQuery(string? SearchText) :IRequest<GetFilteredContactsResponse>;