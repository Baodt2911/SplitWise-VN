import { Response, Request } from "express";
import { catchAsync } from "../helper/catchAsync";
import { CreateGroupDTO, UpdateGroupDTO } from "../dtos/req";
import {
  createGroupService,
  deleteGroupService,
  getAllGroupService,
  getGroupService,
  updateGroupService,
  addMemberService,
  verifyInviteTokenService,
  acceptInviteService,
  joinGroupService,
} from "../services";
import { StatusCodes } from "http-status-codes";

export const createGroupController = catchAsync(
  async (req: Request<{}, {}, CreateGroupDTO>, res: Response) => {
    const userId = req.user?.userId;

    await createGroupService(userId!, req.body);
    res.status(StatusCodes.CREATED).json({
      message: "Created group successfully",
    });
  }
);

export const updateGroupControlleer = catchAsync(
  async (
    req: Request<
      {
        groupId: string;
      },
      {},
      Partial<UpdateGroupDTO>
    >,
    res: Response
  ) => {
    const userId = req.user?.userId;

    await updateGroupService(userId!, req.params.groupId, req.body);
    res.status(StatusCodes.OK).json({
      message: "Updated group successfully",
    });
  }
);

export const deleteGroupController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    const userId = req.user?.userId;
    await deleteGroupService(userId!, req.params.groupId);
    res.status(StatusCodes.OK).json({
      message: "Deleted groupd successfully",
    });
  }
);

export const getAllGroupController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const groups = await getAllGroupService(userId!);
    res.status(StatusCodes.OK).json({
      groups,
    });
  }
);

export const getGroupController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    const userId = req.user?.userId;
    const group = await getGroupService(userId!, req.params.groupId);
    res.status(StatusCodes.OK).json({
      group,
    });
  }
);

export const addMemberController = catchAsync(
  async (
    req: Request<{ groupId: string }, {}, { phone: string }>,
    res: Response
  ) => {
    const userId = req.user?.userId;
    const { added } = await addMemberService(
      userId!,
      req.params.groupId,
      req.body.phone
    );
    res.status(StatusCodes.OK).json({
      message: added ? "Added to group" : "Invitation sent",
    });
  }
);

export const verifyInviteTokenController = catchAsync(
  async (req: Request<{ token: string }>, res: Response) => {
    await verifyInviteTokenService(req.params.token);
    res.status(StatusCodes.OK).json({
      message: "Token verified",
    });
  }
);

export const acceptInviteController = catchAsync(
  async (req: Request<{ token: string }>, res: Response) => {
    const userId = req.user?.userId;
    await acceptInviteService(req.params.token, userId!);
    res.status(StatusCodes.OK).json({
      message: "Invitation accepted",
    });
  }
);

export const joinGroupController = catchAsync(
  async (req: Request<{ code: string }>, res: Response) => {
    const userId = req.user?.userId;
    await joinGroupService(userId!, req.params.code);
    res.status(StatusCodes.OK).json({
      message: "Joined the group",
    });
  }
);
