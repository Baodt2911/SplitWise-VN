import { Response, Request } from "express";
import { catchAsync } from "../helper/catchAsync";
import { CreateGroupDTO, UpdateGroupDTO } from "../dtos/req";
import {
  createGroupService,
  deleteGroupService,
  getAllGroupService,
  getGroupService,
  updateGroupService,
} from "../services";
import { StatusCodes } from "http-status-codes";

export const createGroupController = catchAsync(
  async (req: Request<{}, {}, CreateGroupDTO>, res: Response) => {
    await createGroupService(req.user, req.body);
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
    await updateGroupService(req.user, req.params.groupId, req.body);
    res.status(StatusCodes.OK).json({
      message: "Updated group successfully",
    });
  }
);

export const deleteGroupController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    await deleteGroupService(req.user, req.params.groupId);
    res.status(StatusCodes.OK).json({
      message: "Deleted groupd successfully",
    });
  }
);

export const getAllGroupController = catchAsync(
  async (req: Request, res: Response) => {
    const groups = await getAllGroupService(req.user);
    res.status(StatusCodes.OK).json({
      groups,
    });
  }
);

export const getGroupController = catchAsync(
  async (req: Request<{ groupId: string }>, res: Response) => {
    const group = await getGroupService(req.user, req.params.groupId);
    res.status(StatusCodes.OK).json({
      group,
    });
  }
);
