import { leaveGroupService } from "./../services/group.service";
import { Response, Request } from "express";
import { catchAsync } from "../helper/catchAsync";
import { CreateGroupDTO, UpdateGroupDTO } from "../dtos";
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
  removeMemberService,
} from "../services";
import { StatusCodes } from "http-status-codes";

export const createGroupController = catchAsync(
  async (req: Request<{}, {}, CreateGroupDTO>, res: Response) => {
    const userId = req.user?.userId;

    const data = await createGroupService(userId!, req.body);
    res.status(StatusCodes.CREATED).json({
      message: "Tạo nhóm thành công",
      data,
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
      UpdateGroupDTO
    >,
    res: Response
  ) => {
    const userId = req.user?.userId;

    const data = await updateGroupService(
      userId!,
      req.params.groupId,
      req.body
    );
    res.status(StatusCodes.OK).json({
      message: "Cập nhật nhóm thành công",
      data,
    });
  }
);

export const deleteGroupController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    const userId = req.user?.userId;
    await deleteGroupService(userId!, req.params.groupId);
    res.status(StatusCodes.OK).json({
      message: "Xóa nhóm thành công",
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
      message: added ? "Đã thêm vào nhóm" : "Đã gửi lời mời",
    });
  }
);

export const verifyInviteTokenController = catchAsync(
  async (req: Request<{ token: string }>, res: Response) => {
    await verifyInviteTokenService(req.params.token);
    res.status(StatusCodes.OK).json({
      message: "Token đã được xác thực",
    });
  }
);

export const acceptInviteController = catchAsync(
  async (req: Request<{ token: string }>, res: Response) => {
    const userId = req.user?.userId;
    await acceptInviteService(req.params.token, userId!);
    res.status(StatusCodes.OK).json({
      message: "Đã chấp nhận lời mời",
    });
  }
);

export const joinGroupController = catchAsync(
  async (req: Request<{ code: string }>, res: Response) => {
    const userId = req.user?.userId;
    await joinGroupService(userId!, req.params.code);
    res.status(StatusCodes.OK).json({
      message: "Đã tham gia nhóm",
    });
  }
);

export const leaveGroupController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    const userId = req.user?.userId;
    await leaveGroupService(userId!, req.params.groupId);
    res.status(StatusCodes.OK).json({
      message: "Đã rời khỏi nhóm",
    });
  }
);

export const removeMemberController = catchAsync(
  async (
    req: Request<{ groupId: string; memberId: string }>,
    res: Response
  ) => {
    const userId = req.user?.userId;
    await removeMemberService(userId!, req.params.groupId, req.params.memberId);
    res.status(StatusCodes.OK).json({
      message: "Đã xóa thành viên khỏi nhóm",
    });
  }
);
